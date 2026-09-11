import { mkdir, readFile, writeFile } from 'node:fs/promises';

const FEED_PATH = 'docs/feed.json';
const BOT_STATE_PATH = 'work/bot-state.json';
const SITE = 'https://traditionele.media/';
const MAX_POSTS_PER_DAY = 24;
const MIN_POST_INTERVAL = 60 * 60 * 1000;
const MAX_POST_LENGTH = 300;
const ACTIVE_WINDOW = 24 * 60 * 60 * 1000;
const MODE = process.env.BOT_MODE || 'dry-run';
const HANDLE = process.env.EUROSKY_HANDLE || 'traditionelemedia.eurosky.social';
const PDS = process.env.EUROSKY_PDS || 'https://eurosky.social';

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch { return fallback; }
}

function amsterdamDay(value) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

function metrics(item) {
  const replies = item.posts.flatMap((post) => post.replies || []);
  return {
    conversations: item.posts.length,
    messages: item.posts.length + replies.length,
    people: new Set([...item.posts, ...replies].map((post) => post.did)).size,
  };
}

function shorten(value, maximum) {
  const values = [...value.trim()];
  return values.length <= maximum ? value.trim() : `${values.slice(0, maximum - 1).join('')}…`;
}

function linkFacet(text, url) {
  const characterStart = text.indexOf(url);
  const byteStart = Buffer.byteLength(text.slice(0, characterStart), 'utf8');
  return {
    index: { byteStart, byteEnd: byteStart + Buffer.byteLength(url, 'utf8') },
    features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
  };
}

function rangeFacet(text, characterStart, characterEnd, url) {
  const byteStart = Buffer.byteLength(text.slice(0, characterStart), 'utf8');
  return {
    index: { byteStart, byteEnd: byteStart + Buffer.byteLength(text.slice(characterStart, characterEnd), 'utf8') },
    features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
  };
}

function amsterdamClock(value) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
}

function shiftDay(day, amount) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function updateDailySummaries(state, items, today) {
  state.daily ||= {};
  for (const item of items) {
    if (!item.id) continue;
    const startersByDay = new Map();
    for (const post of item.posts || []) {
      if (!post.createdAt || !post.did) continue;
      const day = amsterdamDay(post.createdAt);
      if (!startersByDay.has(day)) startersByDay.set(day, new Set());
      startersByDay.get(day).add(post.did);
    }
    for (const [day, starters] of startersByDay) {
      state.daily[day] ||= {};
      const previous = state.daily[day][item.id];
      if (!previous || starters.size >= previous.conversations) {
        state.daily[day][item.id] = {
          id: item.id,
          title: item.title || item.domain,
          conversations: starters.size,
          updatedAt: Number(item.updatedAt) || 0,
        };
      }
    }
  }
  const oldestDay = shiftDay(today, -8);
  for (const day of Object.keys(state.daily)) {
    if (day < oldestDay) delete state.daily[day];
  }
}

function buildDigest(intro, rows) {
  const titles = rows.map((row) => shorten(row.title || 'Link zonder titel', 90));
  const suffixes = rows.map((row) => row.conversations === 1
    ? ' — 1 uniek gesprek'
    : ` — ${row.conversations} unieke gesprekken`);
  const compose = () => `${intro}\n\n${titles.map((title, index) => `${title}${suffixes[index]}`).join('\n\n')}`;
  while ([...compose()].length > MAX_POST_LENGTH) {
    const longest = titles.reduce((best, title, index) => title.length > titles[best].length ? index : best, 0);
    if ([...titles[longest]].length <= 8) break;
    titles[longest] = shorten(titles[longest], [...titles[longest]].length - 1);
  }
  const text = compose();
  let cursor = intro.length + 2;
  const facets = rows.map((row, index) => {
    const start = cursor;
    const end = start + titles[index].length;
    cursor = end + suffixes[index].length + (index === rows.length - 1 ? 0 : 2);
    return rangeFacet(text, start, end, `${SITE}?gesprek=${row.id}`);
  });
  return { text, facets };
}

async function xrpc(method, path, body, accessJwt) {
  const response = await fetch(`${PDS}/xrpc/${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(accessJwt ? { authorization: `Bearer ${accessJwt}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${path} failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json();
}

async function publish(text, facets) {
  const password = process.env.EUROSKY_APP_PASSWORD;
  if (!password) throw new Error('EUROSKY_APP_PASSWORD is missing');
  const session = await xrpc('POST', 'com.atproto.server.createSession', {
    identifier: HANDLE,
    password,
  });
  return xrpc('POST', 'com.atproto.repo.createRecord', {
    repo: session.did,
    collection: 'app.bsky.feed.post',
    record: {
      $type: 'app.bsky.feed.post',
      text,
      facets,
      langs: ['nl'],
      createdAt: new Date().toISOString(),
    },
  }, session.accessJwt);
}

const feed = await readJson(FEED_PATH, { items: [] });
const state = await readJson(BOT_STATE_PATH, { posts: [] });
const now = process.env.BOT_NOW ? Date.parse(process.env.BOT_NOW) : Date.now();
if (!Number.isFinite(now)) throw new Error('BOT_NOW is not a valid date');
const today = amsterdamDay(now);
state.posts ||= [];
state.digests ||= [];
updateDailySummaries(state, feed.items || [], today);

const clock = amsterdamClock(now);
const digestSchedule = clock.hour === 7 && clock.minute < 30
  ? { kind: 'morning', day: shiftDay(today, -1), intro: 'Dit waren gisteren de 3 meest besproken Nederlandse links op Bluesky:' }
  : clock.hour === 20 && clock.minute < 30
    ? { kind: 'evening', day: today, intro: 'Dit waren vandaag de 3 meest besproken Nederlandse links op Bluesky:' }
    : null;
const digestAlreadyPosted = digestSchedule && state.digests.some((digest) =>
  digest.kind === digestSchedule.kind && digest.day === digestSchedule.day);
const digestRows = digestSchedule && !digestAlreadyPosted
  ? Object.values(state.daily?.[digestSchedule.day] || {})
      .filter((row) => row.conversations > 0)
      .sort((a, b) => b.conversations - a.conversations || b.updatedAt - a.updatedAt)
      .slice(0, 3)
  : [];

if (digestRows.length === 3) {
  const digest = buildDigest(digestSchedule.intro, digestRows);
  if (MODE !== 'live') {
    console.log(JSON.stringify({ event: 'digest_dry_run', wouldPost: true, schedule: digestSchedule, text: digest.text }));
    process.exit(0);
  }
  const result = await publish(digest.text, digest.facets);
  state.digests.push({
    kind: digestSchedule.kind,
    day: digestSchedule.day,
    postedAt: now,
    uri: result.uri,
    cid: result.cid,
  });
  await mkdir('work', { recursive: true });
  await writeFile(BOT_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify({ event: 'digest_posted', schedule: digestSchedule, uri: result.uri }));
  process.exit(0);
}

const postedToday = state.posts.filter((post) => amsterdamDay(post.postedAt) === today).length;
const postedUrls = new Set(state.posts.map((post) => post.url));
const lastPostedAt = Math.max(0, ...state.posts.map((post) => Number(post.postedAt) || 0));
const nextPostAt = lastPostedAt + MIN_POST_INTERVAL;

const eligible = feed.items
  .map((item) => ({ item, score: metrics(item) }))
  .filter(({ item, score }) =>
    item.id &&
    score.people >= 2 &&
    now - Number(item.updatedAt) <= ACTIVE_WINDOW &&
    !postedUrls.has(item.url))
  .sort((a, b) => b.item.updatedAt - a.item.updatedAt || b.score.conversations - a.score.conversations || b.score.people - a.score.people);

if (postedToday >= MAX_POSTS_PER_DAY || now < nextPostAt || eligible.length === 0) {
  if (MODE === 'live') {
    await mkdir('work', { recursive: true });
    await writeFile(BOT_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  }
  console.log(JSON.stringify({
    event: MODE === 'live' ? 'bot_skipped' : 'bot_dry_run',
    wouldPost: false,
    reason: postedToday >= MAX_POSTS_PER_DAY ? 'daily_limit' : now < nextPostAt ? 'hourly_interval' : 'no_eligible_item',
    postedToday,
    dailyLimit: MAX_POSTS_PER_DAY,
    ...(now < nextPostAt ? { nextPostAt: new Date(nextPostAt).toISOString() } : {}),
  }));
  process.exit(0);
}

const { item, score } = eligible[0];
const peopleLabel = score.people === 1 ? 'persoon' : 'mensen';
const url = `${SITE}?gesprek=${item.id}`;
const prefix = 'Veelbesproken op Nederlandstalig Bluesky:\n\n';
const conversationSummary = score.conversations === 1
  ? '1 verschillend account begon hierover een afzonderlijk gesprek'
  : `${score.conversations} verschillende accounts begonnen hierover afzonderlijk een gesprek`;
const suffix = `\n\n${conversationSummary} · ${score.messages} berichten van ${score.people} ${peopleLabel}\n\nBekijk de gesprekken:\n${url}`;
const title = shorten(item.title || item.domain, MAX_POST_LENGTH - [...prefix, ...suffix].length);
const text = `${prefix}${title}${suffix}`;

if (MODE !== 'live') {
  console.log(JSON.stringify({
    event: 'bot_dry_run',
    wouldPost: true,
    handle: HANDLE,
    pds: PDS,
    dailyLimit: MAX_POSTS_PER_DAY,
    candidate: { id: item.id, url: item.url, text },
  }));
  process.exit(0);
}

const result = await publish(text, [linkFacet(text, url)]);
state.posts.push({
  id: item.id,
  url: item.url,
  postedAt: Date.now(),
  uri: result.uri,
  cid: result.cid,
});
await mkdir('work', { recursive: true });
await writeFile(BOT_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(JSON.stringify({
  event: 'bot_posted',
  id: item.id,
  uri: result.uri,
  postedToday: postedToday + 1,
  dailyLimit: MAX_POSTS_PER_DAY,
}));
