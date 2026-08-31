import { DurableObject } from "cloudflare:workers";

const ORIGIN = "https://hackejandro.github.io";
const JETSTREAM = "wss://jetstream2.us-east.bsky.network/subscribe";
const API = "https://public.api.bsky.app/xrpc";
const SNAPSHOT_KEY = "feed:v3";
const DAY = 24 * 60 * 60 * 1000;
const SNAPSHOT_INTERVAL = 15 * 60 * 1000;
const MAX_CANDIDATES = 300;
const MAX_MESSAGES = 20;

type Link = { url: string; title: string; description: string };
type Candidate = { uri: string; did: string; rkey: string; text: string; createdAt: string; links: Link[] };
type Reply = { uri: string; did: string; rkey: string; text: string; createdAt: string; handle?: string; displayName?: string };
type FeedPost = Candidate & { replies: Reply[]; handle?: string; displayName?: string };
type FeedItem = { url: string; domain: string; title: string; description: string; updatedAt: number; posts: FeedPost[] };
type Snapshot = { generatedAt: string; expiresAfterHours: 24; items: FeedItem[] };
type CandidateRow = {
  uri: string; did: string; rkey: string; text: string; created_at: number;
  url: string; title: string; description: string;
};
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

function responseHeaders(): HeadersInit {
  return { "Access-Control-Allow-Origin": ORIGIN, "Cache-Control": "public, max-age=60, s-maxage=300" };
}

function isDutch(langs: unknown): boolean {
  return Array.isArray(langs) && langs.some((lang) =>
    typeof lang === "string" && lang.toLowerCase().split("-")[0] === "nl"
  );
}

function cleanUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
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

export class CommonplaceCollector extends DurableObject<Env> {
  private socket: WebSocket | null = null;
  private latestCursor = 0;
  private framesSinceCursorWrite = 0;
  private building = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS candidates (
          uri TEXT NOT NULL,
          url TEXT NOT NULL,
          did TEXT NOT NULL,
          rkey TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          PRIMARY KEY (uri, url)
        );
        CREATE INDEX IF NOT EXISTS candidates_created_at ON candidates(created_at DESC);
        CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
      const cursor = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'cursor'").toArray()[0];
      this.latestCursor = Number(cursor?.value) || 0;
    });
  }

  async ensureStarted(): Promise<void> {
    if (!this.socket || this.socket.readyState > WebSocket.OPEN) this.connect();
    const alarm = await this.ctx.storage.getAlarm();
    if (alarm === null) await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }

  async tick(): Promise<void> {
    await this.ensureStarted();
    await this.refreshIfDue();
  }

  async refreshNow(): Promise<void> {
    await this.ensureStarted();
    await this.buildSnapshot();
  }

  async status(): Promise<{ connected: boolean; candidates: number; lastEventAt: string | null; generatedAt: string | null }> {
    const count = this.ctx.storage.sql.exec<{ count: number }>("SELECT COUNT(DISTINCT uri) AS count FROM candidates").one().count;
    const lastEvent = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'last_event_at'").toArray()[0];
    const snapshot = await this.env.COMMONPLACE.get<Snapshot>(SNAPSHOT_KEY, "json");
    return {
      connected: this.socket?.readyState === WebSocket.OPEN,
      candidates: count,
      lastEventAt: lastEvent?.value ?? null,
      generatedAt: snapshot?.generatedAt ?? null,
    };
  }

  async alarm(): Promise<void> {
    await this.ensureStarted();
    await this.refreshIfDue();
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }

  private connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    const url = new URL(JETSTREAM);
    url.searchParams.append("wantedCollections", "app.bsky.feed.post");
    url.searchParams.set("maxMessageSizeBytes", "50000");
    const fallback = (Date.now() - 5 * 60 * 1000) * 1000;
    url.searchParams.set("cursor", String(Math.max(this.latestCursor - 60_000_000, fallback)));
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.addEventListener("message", (message) => this.handleMessage(message));
    socket.addEventListener("close", () => this.handleDisconnect(socket));
    socket.addEventListener("error", () => this.handleDisconnect(socket));
  }

  private handleMessage(message: MessageEvent): void {
    if (typeof message.data !== "string") return;
    try {
      const value: unknown = JSON.parse(message.data);
      if (!value || typeof value !== "object") return;
      const event = value as JetEvent;
      if (event.time_us) {
        this.latestCursor = Math.max(this.latestCursor, event.time_us);
        this.framesSinceCursorWrite += 1;
      }
      const candidate = candidateFrom(event);
      if (candidate) this.storeCandidate(candidate);
      if (candidate || this.framesSinceCursorWrite >= 500) this.persistCursor();
    } catch { /* Een ongeldig Jetstream-frame wordt genegeerd. */ }
  }

  private handleDisconnect(socket: WebSocket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    this.persistCursor();
    this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now() + 2_000));
  }

  private persistCursor(): void {
    if (!this.latestCursor) return;
    this.ctx.storage.sql.exec(
      "INSERT INTO meta(key, value) VALUES('cursor', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      String(this.latestCursor),
    );
    this.framesSinceCursorWrite = 0;
  }

  private storeCandidate(candidate: Candidate): void {
    const createdAt = new Date(candidate.createdAt).getTime();
    if (!Number.isFinite(createdAt) || createdAt < Date.now() - DAY) return;
    for (const link of candidate.links) {
      this.ctx.storage.sql.exec(
        `INSERT INTO candidates(uri, url, did, rkey, text, created_at, title, description)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(uri, url) DO UPDATE SET
           text = excluded.text, created_at = excluded.created_at,
           title = excluded.title, description = excluded.description`,
        candidate.uri, link.url, candidate.did, candidate.rkey, candidate.text,
        createdAt, link.title, link.description,
      );
    }
    this.ctx.storage.sql.exec(
      "INSERT INTO meta(key, value) VALUES('last_event_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      new Date().toISOString(),
    );
  }

  private async refreshIfDue(): Promise<void> {
    const row = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'snapshot_at'").toArray()[0];
    if (!row || Date.now() - Number(row.value) >= SNAPSHOT_INTERVAL) await this.buildSnapshot();
  }

  private async buildSnapshot(): Promise<void> {
    if (this.building) return;
    this.building = true;
    try {
      const cutoff = Date.now() - DAY;
      this.ctx.storage.sql.exec("DELETE FROM candidates WHERE created_at < ?", cutoff);
      const rows = this.ctx.storage.sql.exec<CandidateRow>(
        "SELECT uri, did, rkey, text, created_at, url, title, description FROM candidates ORDER BY created_at DESC LIMIT ?",
        MAX_CANDIDATES,
      ).toArray();
      const byUri = new Map<string, Candidate>();
      for (const row of rows) {
        const post = byUri.get(row.uri) ?? {
          uri: row.uri, did: row.did, rkey: row.rkey, text: row.text,
          createdAt: new Date(row.created_at).toISOString(), links: [],
        };
        post.links.push({ url: row.url, title: row.title, description: row.description });
        byUri.set(row.uri, post);
      }
      const candidates = [...byUri.values()];
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
      const groups = [...grouped.values()].sort((a, b) => b.score - a.score).slice(0, 20);
      const roots = groups.flatMap((group) => group.posts).slice(0, 20);
      const hydrated = new Map<string, FeedPost>();
      for (let offset = 0; offset < roots.length; offset += 4) {
        for (const post of await Promise.all(roots.slice(offset, offset + 4).map(hydrate))) {
          if (post) hydrated.set(post.uri, post);
        }
      }
      const items: FeedItem[] = [];
      for (const group of groups) {
        const posts = group.posts.map((post) => hydrated.get(post.uri)).filter((post): post is FeedPost => Boolean(post));
        if (!posts.length) continue;
        const parsed = new URL(group.link.url);
        items.push({
          url: group.link.url, domain: parsed.hostname.replace(/^www\./, ""),
          title: group.link.title, description: group.link.description, posts,
          updatedAt: Math.max(...posts.map((post) => new Date(post.createdAt).getTime())),
        });
      }
      items.sort((a, b) => b.posts.length - a.posts.length ||
        b.posts.reduce((n, p) => n + p.replies.length, 0) - a.posts.reduce((n, p) => n + p.replies.length, 0) ||
        b.updatedAt - a.updatedAt);
      let remaining = MAX_MESSAGES;
      const limited: FeedItem[] = [];
      for (const item of items) {
        const posts: FeedPost[] = [];
        for (const post of item.posts) {
          if (remaining < 2) break;
          const replies = post.replies.slice(0, remaining - 1);
          if (!replies.length) continue;
          posts.push({ ...post, replies });
          remaining -= 1 + replies.length;
        }
        if (posts.length) limited.push({ ...item, posts });
        if (remaining < 2) break;
      }
      const snapshot: Snapshot = { generatedAt: new Date().toISOString(), expiresAfterHours: 24, items: limited };
      await this.env.COMMONPLACE.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
      this.ctx.storage.sql.exec(
        "INSERT INTO meta(key, value) VALUES('snapshot_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        String(Date.now()),
      );
      console.log(JSON.stringify({ event: "snapshot_refreshed", candidates: candidates.length, items: limited.length }));
    } finally {
      this.building = false;
    }
  }
}

function collector(env: Env): DurableObjectStub<CommonplaceCollector> {
  return env.COLLECTOR.getByName("nederland");
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const path = new URL(request.url).pathname;
    const instance = collector(env);
    if (path === "/health") {
      const state = await instance.status();
      return Response.json({ ok: true, ...state }, { headers: responseHeaders() });
    }
    if (path !== "/feed") return new Response("Commonplace gedeelde feed");
    ctx.waitUntil(instance.ensureStarted());
    const snapshot = await env.COMMONPLACE.get<Snapshot>(SNAPSHOT_KEY, "json");
    if (!snapshot) {
      ctx.waitUntil(instance.refreshNow());
      return Response.json({ generatedAt: null, expiresAfterHours: 24, items: [] }, { status: 202, headers: responseHeaders() });
    }
    return Response.json(snapshot, { headers: responseHeaders() });
  },
  async scheduled(_controller, env): Promise<void> {
    await collector(env).tick();
  },
} satisfies ExportedHandler<Env>;
