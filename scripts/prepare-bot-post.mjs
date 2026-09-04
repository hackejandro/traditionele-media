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

async function publish(text, linkUrl) {
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
      facets: [linkFacet(text, linkUrl)],
      langs: ['nl'],
      createdAt: new Date().toISOString(),
    },
  }, session.accessJwt);
}

const feed = await readJson(FEED_PATH, { items: [] });
const state = await readJson(BOT_STATE_PATH, { posts: [] });
const now = Date.now();
const today = amsterdamDay(now);
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
const conversationLabel = score.conversations === 1 ? 'gesprek' : 'gesprekken';
const peopleLabel = score.people === 1 ? 'persoon' : 'mensen';
const url = `${SITE}?gesprek=${item.id}`;
const prefix = 'Nieuw gesprek op traditionele.media\n\n';
const suffix = `\n\n${score.conversations} ${conversationLabel} · ${score.messages} berichten · ${score.people} ${peopleLabel}\n\nBekijk wat verschillende mensen erover zeggen:\n${url}`;
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

const result = await publish(text, url);
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
