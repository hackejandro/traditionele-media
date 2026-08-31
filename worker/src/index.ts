const ORIGIN = "https://hackejandro.github.io";
const JETSTREAM = "wss://jetstream2.us-east.bsky.network/subscribe";
const API = "https://public.api.bsky.app/xrpc";
const KEYS = { snapshot: "feed:v2", candidates: "candidates:v2", cursor: "cursor:v2" };
const DAY = 24 * 60 * 60 * 1000;
const MAX_CANDIDATES = 300;
const MAX_ITEMS = 20;
const MAX_MESSAGES = 20;

type Link = { url: string; title: string; description: string };
type Candidate = { uri: string; did: string; rkey: string; text: string; createdAt: string; links: Link[] };
type Reply = { uri: string; did: string; rkey: string; text: string; createdAt: string; handle?: string; displayName?: string };
type FeedPost = Candidate & { replies: Reply[]; handle?: string; displayName?: string };
type FeedItem = { url: string; domain: string; title: string; description: string; updatedAt: number; posts: FeedPost[] };
type Snapshot = { generatedAt: string; expiresAfterHours: 24; items: FeedItem[] };
type PostView = {
  uri?: string; replyCount?: number; indexedAt?: string;
  record?: { text?: string; createdAt?: string; langs?: string[] };
  author?: { did?: string; handle?: string; displayName?: string };
};
type JetEvent = {
  did?: string; time_us?: number; kind?: string;
  commit?: { operation?: string; collection?: string; rkey?: string; record?: {
    langs?: string[]; text?: string; createdAt?: string;
    facets?: Array<{ features?: Array<{ uri?: string }> }>;
    embed?: { external?: { uri?: string; title?: string; description?: string } };
  } };
};

function headers(): HeadersInit {
  return { "Access-Control-Allow-Origin": ORIGIN, "Cache-Control": "public, max-age=60, s-maxage=300" };
}

function isDutch(langs: unknown): boolean {
  return Array.isArray(langs) && langs.some((lang) => typeof lang === "string" && lang.toLowerCase().split("-")[0] === "nl");
}

function cleanUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch { return null; }
}

function linksFrom(event: JetEvent): Link[] {
  const record = event.commit?.record;
  if (!record) return [];
  const found: Link[] = [];
  const external = record.embed?.external;
  if (external?.uri) found.push({ url: external.uri, title: external.title ?? "", description: external.description ?? "" });
  for (const facet of record.facets ?? []) for (const feature of facet.features ?? []) {
    if (feature.uri) found.push({ url: feature.uri, title: "", description: "" });
  }
  const unique = new Map<string, Link>();
  for (const link of found) {
    const url = cleanUrl(link.url);
    if (url && !unique.has(url)) unique.set(url, { ...link, url });
  }
  return [...unique.values()];
}

function candidateFrom(event: JetEvent): Candidate | null {
  const commit = event.commit;
  const record = commit?.record;
  if (event.kind !== "commit" || commit?.collection !== "app.bsky.feed.post" ||
      !["create", "update"].includes(commit.operation ?? "") || !event.did || !commit.rkey ||
      !record || !isDutch(record.langs)) return null;
  const links = linksFrom(event);
  if (!links.length) return null;
  return {
    uri: `at://${event.did}/app.bsky.feed.post/${commit.rkey}`,
    did: event.did, rkey: commit.rkey, text: record.text ?? "",
    createdAt: record.createdAt ?? new Date().toISOString(), links,
  };
}

function isCandidate(value: unknown): value is Candidate {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return typeof post.uri === "string" && typeof post.did === "string" && typeof post.rkey === "string" &&
    typeof post.createdAt === "string" && Array.isArray(post.links);
}

async function collect(cursor: number): Promise<{ posts: Candidate[]; cursor: number }> {
  const url = new URL(JETSTREAM);
  url.searchParams.append("wantedCollections", "app.bsky.feed.post");
  url.searchParams.set("maxMessageSizeBytes", "50000");
  url.searchParams.set("cursor", String(cursor));
  const socket = new WebSocket(url);
  const posts = new Map<string, Candidate>();
  let latest = cursor;
  await new Promise<void>((resolve) => {
    let complete = false;
    const finish = () => {
      if (complete) return;
      complete = true;
      clearTimeout(timer);
      if ([WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)) socket.close(1000, "Momentopname compleet");
      resolve();
    };
    const timer = setTimeout(finish, 90_000);
    socket.addEventListener("message", (message) => {
      if (typeof message.data !== "string") return;
      try {
        const value: unknown = JSON.parse(message.data);
        if (!value || typeof value !== "object") return;
        const event = value as JetEvent;
        latest = Math.max(latest, event.time_us ?? 0);
        const post = candidateFrom(event);
        if (post) posts.set(post.uri, post);
        if ((event.time_us ?? 0) >= (Date.now() - 2_000) * 1000) finish();
      } catch { /* Een ongeldig frame wordt genegeerd. */ }
    });
    socket.addEventListener("error", finish);
    socket.addEventListener("close", finish);
  });
  return { posts: [...posts.values()], cursor: latest };
}

async function postViews(posts: Candidate[]): Promise<Map<string, PostView>> {
  const result = new Map<string, PostView>();
  for (let offset = 0; offset < posts.length; offset += 25) {
    const url = new URL(`${API}/app.bsky.feed.getPosts`);
    for (const post of posts.slice(offset, offset + 25)) url.searchParams.append("uris", post.uri);
    const response = await fetch(url);
    if (!response.ok) continue;
    const data: unknown = await response.json();
    const values = data && typeof data === "object" ? (data as { posts?: unknown }).posts : null;
    if (!Array.isArray(values)) continue;
    for (const value of values) if (value && typeof value === "object") {
      const view = value as PostView;
      if (view.uri) result.set(view.uri, view);
    }
  }
  return result;
}

function replyFrom(view: PostView): Reply | null {
  if (!view.uri || !view.author?.did) return null;
  return {
    uri: view.uri, did: view.author.did, rkey: view.uri.replace("at://", "").split("/")[2] ?? "",
    text: view.record?.text ?? "", createdAt: view.record?.createdAt ?? view.indexedAt ?? new Date().toISOString(),
    handle: view.author.handle, displayName: view.author.displayName,
  };
}

function collectReplies(node: unknown, replies: Reply[]): void {
  if (!node || typeof node !== "object") return;
  for (const child of (node as { replies?: unknown[] }).replies ?? []) {
    if (!child || typeof child !== "object") continue;
    const post = (child as { post?: PostView }).post;
    if (post && isDutch(post.record?.langs)) {
      const reply = replyFrom(post);
      if (reply) replies.push(reply);
    }
    collectReplies(child, replies);
  }
}

async function hydrate(candidate: Candidate): Promise<FeedPost | null> {
  const url = new URL(`${API}/app.bsky.feed.getPostThread`);
  url.searchParams.set("uri", candidate.uri);
  url.searchParams.set("depth", "6");
  url.searchParams.set("parentHeight", "0");
  const response = await fetch(url);
  if (!response.ok) return null;
  const data: unknown = await response.json();
  const thread = data && typeof data === "object" ? (data as { thread?: { post?: PostView } }).thread : null;
  const root = thread?.post;
  if (!root) return null;
  const replies: Reply[] = [];
  collectReplies(thread, replies);
  if (!replies.length) return null;
  return { ...candidate, text: root.record?.text ?? candidate.text, replies, handle: root.author?.handle, displayName: root.author?.displayName };
}

async function refresh(env: Env): Promise<Snapshot> {
  const now = Date.now();
  const stored: unknown = await env.COMMONPLACE.get(KEYS.candidates, "json");
  const old = Array.isArray(stored) ? stored.filter(isCandidate) : [];
  const savedCursor = Number(await env.COMMONPLACE.get(KEYS.cursor));
  const earliest = (now - 70 * 60 * 1000) * 1000;
  const cursor = Number.isFinite(savedCursor) ? Math.max(savedCursor - 60_000_000, earliest) : earliest;
  const incoming = await collect(cursor);
  const unique = new Map<string, Candidate>();
  for (const post of [...old, ...incoming.posts]) {
    const created = new Date(post.createdAt).getTime();
    if (Number.isFinite(created) && created >= now - DAY) unique.set(post.uri, post);
  }
  const candidates = [...unique.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_CANDIDATES);
  const views = await postViews(candidates);
  const grouped = new Map<string, { link: Link; posts: Candidate[]; score: number }>();
  for (const post of candidates) {
    const replyCount = views.get(post.uri)?.replyCount ?? 0;
    if (!replyCount) continue;
    for (const link of post.links) {
      const group = grouped.get(link.url) ?? { link: { ...link }, posts: [], score: 0 };
      if (link.title) group.link.title = link.title;
      if (link.description) group.link.description = link.description;
      group.posts.push(post);
      group.score += 1000 + replyCount;
      grouped.set(link.url, group);
    }
  }
  const groups = [...grouped.values()].sort((a, b) => b.score - a.score).slice(0, MAX_ITEMS);
  const roots = groups.flatMap((group) => group.posts).slice(0, MAX_ITEMS);
  const hydrated = new Map<string, FeedPost>();
  for (let offset = 0; offset < roots.length; offset += 4) {
    for (const post of await Promise.all(roots.slice(offset, offset + 4).map(hydrate))) if (post) hydrated.set(post.uri, post);
  }
  const items: FeedItem[] = [];
  for (const group of groups) {
    const posts = group.posts.map((post) => hydrated.get(post.uri)).filter((post): post is FeedPost => Boolean(post));
    if (!posts.length) continue;
    const parsed = new URL(group.link.url);
    items.push({
      url: group.link.url, domain: parsed.hostname.replace(/^www\./, ""), title: group.link.title,
      description: group.link.description, posts,
      updatedAt: Math.max(...posts.map((post) => new Date(post.createdAt).getTime())),
    });
  }
  items.sort((a, b) => b.posts.length - a.posts.length ||
    b.posts.reduce((n, p) => n + p.replies.length, 0) - a.posts.reduce((n, p) => n + p.replies.length, 0) || b.updatedAt - a.updatedAt);
  let remainingMessages = MAX_MESSAGES;
  const limitedItems: FeedItem[] = [];
  for (const item of items.slice(0, MAX_ITEMS)) {
    const posts: FeedPost[] = [];
    for (const post of item.posts) {
      if (remainingMessages < 2) break;
      const replies = post.replies.slice(0, remainingMessages - 1);
      if (!replies.length) continue;
      posts.push({ ...post, replies });
      remainingMessages -= 1 + replies.length;
    }
    if (posts.length) limitedItems.push({ ...item, posts });
    if (remainingMessages < 2) break;
  }
  const snapshot: Snapshot = { generatedAt: new Date().toISOString(), expiresAfterHours: 24, items: limitedItems };
  await Promise.all([
    env.COMMONPLACE.put(KEYS.candidates, JSON.stringify(candidates)),
    env.COMMONPLACE.put(KEYS.cursor, String(incoming.cursor)),
    env.COMMONPLACE.put(KEYS.snapshot, JSON.stringify(snapshot)),
  ]);
  console.log(JSON.stringify({ event: "snapshot_refreshed", candidates: candidates.length, items: snapshot.items.length }));
  return snapshot;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const path = new URL(request.url).pathname;
    const snapshot = await env.COMMONPLACE.get<Snapshot>(KEYS.snapshot, "json");
    if (path === "/health") return Response.json({ ok: true, generatedAt: snapshot?.generatedAt ?? null }, { headers: headers() });
    if (path !== "/feed") return new Response("Commonplace gedeelde feed");
    if (!snapshot) {
      ctx.waitUntil(refresh(env));
      return Response.json({ generatedAt: null, expiresAfterHours: 24, items: [] }, { status: 202, headers: headers() });
    }
    return Response.json(snapshot, { headers: headers() });
  },
  async scheduled(_controller, env): Promise<void> { await refresh(env); },
} satisfies ExportedHandler<Env>;
