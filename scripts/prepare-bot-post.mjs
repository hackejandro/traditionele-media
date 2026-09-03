import { mkdir, readFile, writeFile } from 'node:fs/promises';

const FEED_PATH = 'docs/feed.json';
const BOT_STATE_PATH = 'work/bot-state.json';
const SITE = 'https://traditionele.media/';
const MAX_POSTS_PER_DAY = 8;
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

function starterReply(posts) {
  const header = 'Inclusief gesprekken gestart door:';
  const starters = [];
  const seen = new Set();
  let text = header;
  for (const post of posts) {
    const handle = String(post.handle || '').replace(/^@/, '').trim();
    if (!handle || !post.did || seen.has(post.did)) continue;
    const line = `@${handle}`;
    const next = `${text}\n\n${line}`;
    if ([...next].length > MAX_POST_LENGTH) continue;
    text = next;
    starters.push({ handle, did: post.did });
    seen.add(post.did);
  }
  const facets = [];
  let from = 0;
  for (const starter of starters) {
    const tag = `@${starter.handle}`;
    const characterStart = text.indexOf(tag, from);
    const byteStart = Buffer.byteLength(text.slice(0, characterStart), 'utf8');
    facets.push({
      index: { byteStart, byteEnd: byteStart + Buffer.byteLength(tag, 'utf8') },
      features: [{ $type: 'app.bsky.richtext.facet#mention', did: starter.did }],
    });
    from = characterStart + tag.length;
  }
  return { text, facets, starters };
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

async function publish(text, linkUrl, reply) {
  const password = process.env.EUROSKY_APP_PASSWORD;
  if (!password) throw new Error('EUROSKY_APP_PASSWORD is missing');
  const session = await xrpc('POST', 'com.atproto.server.createSession', {
    identifier: HANDLE,
    password,
  });
  const root = await xrpc('POST', 'com.atproto.repo.createRecord', {
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
  const response = await xrpc('POST', 'com.atproto.repo.createRecord', {
    repo: session.did,
    collection: 'app.bsky.feed.post',
    record: {
      $type: 'app.bsky.feed.post',
      text: reply.text,
      facets: reply.facets,
      reply: {
        root: { uri: root.uri, cid: root.cid },
        parent: { uri: root.uri, cid: root.cid },
      },
      langs: ['nl'],
      createdAt: new Date().toISOString(),
    },
  }, session.accessJwt);
  return { root, reply: response };
}

const feed = await readJson(FEED_PATH, { items: [] });
const state = await readJson(BOT_STATE_PATH, { posts: [] });
const now = Date.now();
const today = amsterdamDay(now);
const postedToday = state.posts.filter((post) => amsterdamDay(post.postedAt) === today).length;
const postedUrls = new Set(state.posts.map((post) => post.url));

const eligible = feed.items
  .map((item) => ({ item, score: metrics(item) }))
  .filter(({ item, score }) =>
    item.id &&
    score.people >= 2 &&
    now - Number(item.updatedAt) <= ACTIVE_WINDOW &&
    !postedUrls.has(item.url))
  .sort((a, b) => b.item.updatedAt - a.item.updatedAt || b.score.conversations - a.score.conversations || b.score.people - a.score.people);

if (postedToday >= MAX_POSTS_PER_DAY || eligible.length === 0) {
  console.log(JSON.stringify({ event: MODE === 'live' ? 'bot_skipped' : 'bot_dry_run', wouldPost: false, postedToday, dailyLimit: MAX_POSTS_PER_DAY }));
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
const reply = starterReply(item.posts);

if (MODE !== 'live') {
  console.log(JSON.stringify({
    event: 'bot_dry_run',
    wouldPost: true,
    handle: HANDLE,
    pds: PDS,
    dailyLimit: MAX_POSTS_PER_DAY,
    candidate: { id: item.id, url: item.url, text, replyText: reply.text, mentionedAccounts: reply.starters.length },
  }));
  process.exit(0);
}

const result = await publish(text, url, reply);
state.posts.push({
  id: item.id,
  url: item.url,
  postedAt: Date.now(),
  uri: result.root.uri,
  cid: result.root.cid,
  replyUri: result.reply.uri,
  replyCid: result.reply.cid,
});
await mkdir('work', { recursive: true });
await writeFile(BOT_STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
console.log(JSON.stringify({
  event: 'bot_thread_posted',
  id: item.id,
  uri: result.root.uri,
  replyUri: result.reply.uri,
  mentionedAccounts: reply.starters.length,
  postedToday: postedToday + 1,
  dailyLimit: MAX_POSTS_PER_DAY,
}));
