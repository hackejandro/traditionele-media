import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const JETSTREAM = 'wss://jetstream2.us-east.bsky.network/subscribe';
const API = 'https://public.api.bsky.app/xrpc';
const LEGACY_FEED = 'https://commonplace-stream.alejandrotauber.workers.dev/feed';
const DAY = 24 * 60 * 60 * 1000;
const INTERVAL = 15 * 60 * 1000;
const MAX_ITEMS = 20;
const STATE_PATH = 'work/collector-state.json';
const FEED_PATH = 'docs/feed.json';

const isDutch = (langs) => Array.isArray(langs) && langs.some((lang) =>
  typeof lang === 'string' && lang.toLowerCase().split('-')[0] === 'nl');

function cleanUrl(value, depth = 0) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (depth < 2 && url.hostname === 'go.bsky.app' && url.pathname === '/redirect') {
      const target = url.searchParams.get('u');
      if (target) return cleanUrl(target, depth + 1);
    }
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_') || ['fbclid', 'gclid'].includes(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch { return null; }
}

function linksFrom(record = {}) {
  const found = [];
  const external = record.embed?.external;
  if (external?.uri) found.push({ url: external.uri, title: external.title || '', description: external.description || '' });
  for (const facet of record.facets || []) for (const feature of facet.features || []) {
    if (feature.uri) found.push({ url: feature.uri, title: '', description: '' });
  }
  const unique = new Map();
  for (const link of found) {
    const url = cleanUrl(link.url);
    if (url && !unique.has(url)) unique.set(url, { ...link, url });
  }
  return [...unique.values()];
}

function candidateFrom(event) {
  const commit = event.commit;
  const record = commit?.record;
  if (event.kind !== 'commit' || commit?.collection !== 'app.bsky.feed.post' ||
      !['create', 'update'].includes(commit.operation) || !event.did || !commit.rkey ||
      !record || !isDutch(record.langs)) return null;
  const links = linksFrom(record);
  if (!links.length) return null;
  return {
    uri: `at://${event.did}/app.bsky.feed.post/${commit.rkey}`,
    did: event.did,
    rkey: commit.rkey,
    text: record.text || '',
    createdAt: record.createdAt || new Date().toISOString(),
    links,
  };
}

async function json(url) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastStatus = response.status;
      await response.body?.cancel();
      if (response.status !== 429 && response.status < 500) break;
      const retryAfter = Number(response.headers.get('retry-after')) * 1000;
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter
        : 500 * (2 ** attempt) + Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 12_000)));
    } catch (error) {
      lastStatus = error?.cause?.code || error?.name || 'network';
      await new Promise((resolve) => setTimeout(resolve, Math.min(500 * (2 ** attempt), 12_000)));
    }
  }
  throw new Error(`${lastStatus} ${url}`);
}

async function getPosts(uris) {
  const result = new Map();
  async function fetchBatch(batch) {
    const url = new URL(`${API}/app.bsky.feed.getPosts`);
    for (const uri of batch) url.searchParams.append('uris', uri);
    try {
      const data = await json(url);
      for (const post of data.posts || []) result.set(post.uri, post);
    } catch (error) {
      if (batch.length > 1) {
        const middle = Math.ceil(batch.length / 2);
        await fetchBatch(batch.slice(0, middle));
        await fetchBatch(batch.slice(middle));
      } else {
        console.warn(JSON.stringify({ event: 'post_lookup_skipped', uri: batch[0], reason: String(error.message || error) }));
      }
    }
  }
  for (let offset = 0; offset < uris.length; offset += 10) {
    await fetchBatch(uris.slice(offset, offset + 10));
  }
  return result;
}

function replyFrom(view) {
  const [, did, , rkey] = view.uri.match(/^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/) || [];
  return {
    uri: view.uri,
    did: view.author?.did || did,
    rkey: rkey || '',
    text: view.record?.text || '',
    createdAt: view.record?.createdAt || view.indexedAt || new Date().toISOString(),
    handle: view.author?.handle,
    displayName: view.author?.displayName,
  };
}

function collectReplies(node, replies) {
  for (const child of node?.replies || []) {
    if (child?.post && isDutch(child.post.record?.langs)) replies.push(replyFrom(child.post));
    collectReplies(child, replies);
  }
}

async function hydrate(candidate, view) {
  if (!(view?.replyCount > 0)) return {
    ...candidate,
    text: view?.record?.text || candidate.text,
    replies: [],
    handle: view?.author?.handle,
    displayName: view?.author?.displayName,
  };
  const url = new URL(`${API}/app.bsky.feed.getPostThread`);
  url.searchParams.set('uri', candidate.uri);
  url.searchParams.set('depth', '6');
  url.searchParams.set('parentHeight', '0');
  const data = await json(url);
  const root = data.thread?.post;
  if (!root) return null;
  const replies = [];
  collectReplies(data.thread, replies);
  return {
    ...candidate,
    text: root.record?.text || candidate.text,
    replies,
    handle: root.author?.handle,
    displayName: root.author?.displayName,
  };
}

async function loadState() {
  try { return JSON.parse(await readFile(STATE_PATH, 'utf8')); }
  catch {
    const state = { cursor: 0, candidates: [], featured: [] };
    try {
      const legacy = await json(LEGACY_FEED);
      const now = Date.now();
      for (const item of legacy.items || []) {
        state.featured.push({ url: item.url, admittedAt: now, expiresAt: now + DAY });
        for (const post of item.posts || []) state.candidates.push({
          uri: post.uri, did: post.did, rkey: post.rkey, text: post.text,
          createdAt: post.createdAt,
          links: [{ url: item.url, title: item.title || '', description: item.description || '' }],
        });
      }
    } catch { /* Een eerste run kan ook zonder de oude feed beginnen. */ }
    return state;
  }
}

async function collect(state) {
  const startCursor = Number(state.cursor) || (Date.now() - INTERVAL) * 1000;
  const targetCursor = (Date.now() - 5_000) * 1000;
  const url = new URL(JETSTREAM);
  url.searchParams.append('wantedCollections', 'app.bsky.feed.post');
  url.searchParams.set('maxMessageSizeBytes', '50000');
  url.searchParams.set('cursor', String(startCursor));
  const candidates = new Map(state.candidates.map((post) => [post.uri, post]));
  const replyRoots = new Set();
  let cursor = startCursor;

  await new Promise((resolve) => {
    const socket = new WebSocket(url);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (socket.readyState <= WebSocket.OPEN) socket.close(1000, 'caught up');
      resolve();
    };
    const timer = setTimeout(finish, 4 * 60 * 1000);
    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(String(message.data));
        if (event.time_us) cursor = Math.max(cursor, event.time_us);
        const candidate = candidateFrom(event);
        if (candidate) candidates.set(candidate.uri, candidate);
        const root = event.commit?.record?.reply?.root?.uri;
        if (!candidate && root && isDutch(event.commit?.record?.langs)) replyRoots.add(root);
        if (cursor >= targetCursor) finish();
      } catch { /* Een ongeldig frame wordt genegeerd. */ }
    });
    socket.addEventListener('close', finish);
    socket.addEventListener('error', finish);
  });

  const missing = [...replyRoots].filter((uri) => !candidates.has(uri));
  const roots = await getPosts(missing);
  for (const root of roots.values()) {
    const links = linksFrom(root.record);
    if (!links.length) continue;
    candidates.set(root.uri, {
      uri: root.uri,
      did: root.author.did,
      rkey: root.uri.split('/').pop(),
      text: root.record?.text || '',
      createdAt: root.record?.createdAt || root.indexedAt,
      links,
    });
  }
  const cutoff = Date.now() - DAY;
  state.cursor = cursor;
  state.candidates = [...candidates.values()].filter((post) => new Date(post.createdAt).getTime() >= cutoff);
}

async function buildFeed(state) {
  const views = await getPosts(state.candidates.map((post) => post.uri));
  const groups = new Map();
  for (const post of state.candidates) for (const link of post.links) {
    const group = groups.get(link.url) || { link: { ...link }, posts: [], score: 0 };
    if (link.title) group.link.title = link.title;
    if (link.description) group.link.description = link.description;
    group.posts.push(post);
    group.score += 1000 + (views.get(post.uri)?.replyCount || 0);
    groups.set(link.url, group);
  }
  const now = Date.now();
  const existing = new Map((state.featured || []).filter((row) => row.expiresAt > now).map((row) => [row.url, row]));
  const ordered = [
    ...existing.keys(),
    ...[...groups.values()].sort((a, b) => b.score - a.score).map((group) => group.link.url),
  ].filter((url, index, all) => all.indexOf(url) === index && groups.has(url));

  const items = [];
  const nextFeatured = [];
  for (const url of ordered) {
    if (items.length >= MAX_ITEMS) break;
    const group = groups.get(url);
    const hydrated = [];
    for (let offset = 0; offset < group.posts.length; offset += 6) {
      const values = await Promise.all(group.posts.slice(offset, offset + 6).map((post) =>
        hydrate(post, views.get(post.uri)).catch(() => null)));
      hydrated.push(...values.filter(Boolean));
    }
    const people = new Set(hydrated.flatMap((post) => [post.did, ...post.replies.map((reply) => reply.did)]));
    if (people.size < 2) continue;
    const parsed = new URL(url);
    const featured = existing.get(url) || { url, admittedAt: now, expiresAt: now + DAY };
    items.push({
      id: createHash('sha256').update(url).digest('hex').slice(0, 12),
      url,
      domain: parsed.hostname.replace(/^www\./, ''),
      title: group.link.title,
      description: group.link.description,
      firstSeenAt: featured.admittedAt,
      posts: hydrated,
      updatedAt: Math.max(...hydrated.flatMap((post) => [
        new Date(post.createdAt).getTime(),
        ...post.replies.map((reply) => new Date(reply.createdAt).getTime()),
      ])),
    });
    nextFeatured.push(featured);
  }
  state.featured = nextFeatured;
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return { generatedAt: new Date().toISOString(), expiresAfterHours: 24, items };
}

await mkdir('work', { recursive: true });
const state = await loadState();
await collect(state);
const feed = await buildFeed(state);
await writeFile(STATE_PATH, `${JSON.stringify(state)}\n`);
await writeFile(FEED_PATH, `${JSON.stringify(feed)}\n`);
console.log(JSON.stringify({ event: 'collection_complete', cursor: state.cursor, candidates: state.candidates.length, items: feed.items.length }));
