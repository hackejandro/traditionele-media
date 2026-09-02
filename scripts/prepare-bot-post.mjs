import { readFile } from 'node:fs/promises';

const FEED_PATH = 'docs/feed.json';
const BOT_STATE_PATH = 'work/bot-state.json';
const SITE = 'https://traditionele.media/';
const MAX_POSTS_PER_DAY = 8;
const MAX_POST_LENGTH = 300;
const NEW_ITEM_WINDOW = 30 * 60 * 1000;

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
    now - Number(item.firstSeenAt) <= NEW_ITEM_WINDOW &&
    !postedUrls.has(item.url))
  .sort((a, b) => b.item.updatedAt - a.item.updatedAt || b.score.conversations - a.score.conversations || b.score.people - a.score.people);

if (postedToday >= MAX_POSTS_PER_DAY || eligible.length === 0) {
  console.log(JSON.stringify({ event: 'bot_dry_run', wouldPost: false, postedToday, dailyLimit: MAX_POSTS_PER_DAY }));
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

console.log(JSON.stringify({
  event: 'bot_dry_run',
  wouldPost: true,
  handle: 'traditionelemedia.eurosky.social',
  pds: 'https://eurosky.social',
  dailyLimit: MAX_POSTS_PER_DAY,
  candidate: { id: item.id, url: item.url, text },
}));
