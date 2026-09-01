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
type FeaturedRow = { url: string; admitted_at: number; expires_at: number };
type PostView = {
  uri?: string; replyCount?: number; indexedAt?: string;
  record?: {
    text?: string; createdAt?: string; langs?: string[];
    facets?: Array<{ features?: Array<{ uri?: string }> }>;
    embed?: { external?: { uri?: string; title?: string; description?: string } };
  };
  author?: { did?: string; handle?: string; displayName?: string };
};
type JetEvent = {
  did?: string; time_us?: number; kind?: string;
  commit?: { operation?: string; collection?: string; rkey?: string; record?: {
    langs?: string[]; text?: string; createdAt?: string;
    facets?: Array<{ features?: Array<{ uri?: string }> }>;
    embed?: { external?: { uri?: string; title?: string; description?: string } };
    reply?: { root?: { uri?: string }; parent?: { uri?: string } };
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

function cleanUrl(value: string, depth = 0): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (depth < 2 && url.hostname === "go.bsky.app" && url.pathname === "/redirect") {
      const target = url.searchParams.get("u");
      if (target) return cleanUrl(target, depth + 1);
    }
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
  private pendingRoots = new Set<string>();

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
        CREATE TABLE IF NOT EXISTS featured (
          url TEXT PRIMARY KEY,
          admitted_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS featured_expires_at ON featured(expires_at);
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

  async backfillRoot(rootUri: string): Promise<void> {
    await this.storeRootForDutchReply(rootUri);
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
      const rootUri = event.commit?.record?.reply?.root?.uri;
      if (!candidate && rootUri && isDutch(event.commit?.record?.langs)) {
        this.ctx.waitUntil(this.storeRootForDutchReply(rootUri));
      }
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

  private async storeRootForDutchReply(rootUri: string): Promise<void> {
    if (this.pendingRoots.has(rootUri)) return;
    const known = this.ctx.storage.sql.exec<{ count: number }>(
      "SELECT COUNT(*) AS count FROM candidates WHERE uri = ?",
      rootUri,
    ).one().count;
    if (known) return;
    this.pendingRoots.add(rootUri);
    try {
      const endpoint = new URL(`${API}/app.bsky.feed.getPosts`);
      endpoint.searchParams.append("uris", rootUri);
      const response = await fetch(endpoint);
      if (!response.ok) return;
      const data: unknown = await response.json();
      const values = data && typeof data === "object" ? (data as { posts?: unknown }).posts : null;
      if (!Array.isArray(values) || !values[0] || typeof values[0] !== "object") return;
      const root = values[0] as PostView;
      if (!root.uri || !root.author?.did || !root.record) return;
      const links = linksFrom({ commit: { record: root.record } });
      if (!links.length) return;
      this.storeCandidate({
        uri: root.uri,
        did: root.author.did,
        rkey: root.uri.replace("at://", "").split("/")[2] ?? "",
        text: root.record.text ?? "",
        createdAt: root.record.createdAt ?? root.indexedAt ?? new Date().toISOString(),
        links,
      });
    } catch (error) {
      console.error(JSON.stringify({
        event: "reply_root_fetch_failed",
        rootUri,
        message: error instanceof Error ? error.message : "unknown",
      }));
    } finally {
      this.pendingRoots.delete(rootUri);
    }
  }

  private async refreshIfDue(): Promise<void> {
    const row = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM meta WHERE key = 'snapshot_at'").toArray()[0];
    if (!row || Date.now() - Number(row.value) >= SNAPSHOT_INTERVAL) await this.buildSnapshot();
  }

  private async buildSnapshot(): Promise<void> {
    if (this.building) return;
    this.building = true;
    try {
      const now = Date.now();
      const cutoff = now - DAY;
      this.ctx.storage.sql.exec("DELETE FROM candidates WHERE created_at < ?", cutoff);
      this.ctx.storage.sql.exec("DELETE FROM featured WHERE expires_at <= ?", now);
      const previous = await this.env.COMMONPLACE.get<Snapshot>(SNAPSHOT_KEY, "json");
      let featured = this.ctx.storage.sql.exec<FeaturedRow>(
        "SELECT url, admitted_at, expires_at FROM featured ORDER BY admitted_at ASC",
      ).toArray();
      if (!featured.length && previous?.items.length) {
        for (const item of previous.items.slice(0, 20)) {
          this.ctx.storage.sql.exec(
            "INSERT OR IGNORE INTO featured(url, admitted_at, expires_at) VALUES(?, ?, ?)",
            item.url, now, now + DAY,
          );
        }
        featured = this.ctx.storage.sql.exec<FeaturedRow>(
          "SELECT url, admitted_at, expires_at FROM featured ORDER BY admitted_at ASC",
        ).toArray();
      }

      const recentRows = this.ctx.storage.sql.exec<CandidateRow>(
        "SELECT uri, did, rkey, text, created_at, url, title, description FROM candidates ORDER BY created_at DESC LIMIT ?",
        MAX_CANDIDATES,
      ).toArray();
      const byUri = new Map<string, Candidate>();
      for (const row of recentRows) {
        const post = byUri.get(row.uri) ?? {
          uri: row.uri, did: row.did, rkey: row.rkey, text: row.text,
          createdAt: new Date(row.created_at).toISOString(), links: [],
        };
        post.links.push({ url: row.url, title: row.title, description: row.description });
        byUri.set(row.uri, post);
      }
      const candidates = [...byUri.values()];
      const views = await postViews(candidates);
      const discovered = new Map<string, { link: Link; posts: Candidate[]; score: number }>();
      for (const post of candidates) {
        const replyCount = views.get(post.uri)?.replyCount ?? 0;
        if (!replyCount) continue;
        for (const link of post.links) {
          const group = discovered.get(link.url) ?? { link: { ...link }, posts: [], score: 0 };
          if (link.title) group.link.title = link.title;
          if (link.description) group.link.description = link.description;
          group.posts.push(post);
          group.score += 1000 + replyCount;
          discovered.set(link.url, group);
        }
      }
      const featuredUrls = new Set(featured.map((row) => row.url));
      for (const group of [...discovered.values()].sort((a, b) => b.score - a.score)) {
        if (featuredUrls.size >= 20) break;
        if (featuredUrls.has(group.link.url)) continue;
        this.ctx.storage.sql.exec(
          "INSERT OR IGNORE INTO featured(url, admitted_at, expires_at) VALUES(?, ?, ?)",
          group.link.url, now, now + DAY,
        );
        featuredUrls.add(group.link.url);
      }
      featured = this.ctx.storage.sql.exec<FeaturedRow>(
        "SELECT url, admitted_at, expires_at FROM featured ORDER BY admitted_at ASC",
      ).toArray();

      const groups = new Map<string, { link: Link; posts: Candidate[]; score: number }>();
      if (featured.length) {
        const placeholders = featured.map(() => "?").join(", ");
        const rows = this.ctx.storage.sql.exec<CandidateRow>(
          `SELECT uri, did, rkey, text, created_at, url, title, description
           FROM candidates WHERE url IN (${placeholders})
           ORDER BY created_at DESC LIMIT 300`,
          ...featured.map((row) => row.url),
        ).toArray();
        for (const row of rows) {
          const group = groups.get(row.url) ?? {
            link: { url: row.url, title: row.title, description: row.description },
            posts: [], score: 0,
          };
          if (row.title) group.link.title = row.title;
          if (row.description) group.link.description = row.description;
          if (!group.posts.some((post) => post.uri === row.uri)) {
            group.posts.push({
              uri: row.uri, did: row.did, rkey: row.rkey, text: row.text,
              createdAt: new Date(row.created_at).toISOString(),
              links: [{ url: row.url, title: row.title, description: row.description }],
            });
          }
          groups.set(row.url, group);
        }
      }
      for (const row of featured) {
        const fresh = discovered.get(row.url);
        if (!fresh) continue;
        const group = groups.get(row.url) ?? { link: fresh.link, posts: [], score: fresh.score };
        for (const post of fresh.posts) if (!group.posts.some((current) => current.uri === post.uri)) group.posts.push(post);
        group.score = fresh.score;
        groups.set(row.url, group);
      }
      const orderedGroups = featured.map((row) => groups.get(row.url)).filter(
        (group): group is { link: Link; posts: Candidate[]; score: number } => Boolean(group),
      );
      const roots: Candidate[] = [];
      for (let index = 0; roots.length < 20; index += 1) {
        let added = false;
        for (const group of orderedGroups) {
          const post = group.posts[index];
          if (post && !roots.some((root) => root.uri === post.uri)) {
            roots.push(post);
            added = true;
            if (roots.length === 20) break;
          }
        }
        if (!added) break;
      }
      const hydrated = new Map<string, FeedPost>();
      for (let offset = 0; offset < roots.length; offset += 4) {
        for (const post of await Promise.all(roots.slice(offset, offset + 4).map(hydrate))) {
          if (post) hydrated.set(post.uri, post);
        }
      }
      const previousByUrl = new Map((previous?.items ?? []).map((item) => [item.url, item]));
      const items: FeedItem[] = [];
      for (const group of orderedGroups) {
        const posts = group.posts.map((post) => hydrated.get(post.uri)).filter((post): post is FeedPost => Boolean(post));
        if (!posts.length) {
          const old = previousByUrl.get(group.link.url);
          if (old) items.push(old);
          else this.ctx.storage.sql.exec("DELETE FROM featured WHERE url = ?", group.link.url);
          continue;
        }
        const parsed = new URL(group.link.url);
        items.push({
          url: group.link.url, domain: parsed.hostname.replace(/^www\./, ""),
          title: group.link.title, description: group.link.description, posts,
          updatedAt: Math.max(...posts.map((post) => new Date(post.createdAt).getTime())),
        });
      }
      const limited = this.limitMessages(items);
      const snapshot: Snapshot = { generatedAt: new Date().toISOString(), expiresAfterHours: 24, items: limited };
      await this.env.COMMONPLACE.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
      this.ctx.storage.sql.exec(
        "INSERT INTO meta(key, value) VALUES('snapshot_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        String(Date.now()),
      );
      console.log(JSON.stringify({ event: "snapshot_refreshed", candidates: candidates.length, featured: featured.length, items: limited.length }));
    } finally {
      this.building = false;
    }
  }

  private limitMessages(items: FeedItem[]): FeedItem[] {
    const visible = items.filter((item) => item.posts.some((post) => post.replies.length)).slice(0, 20);
    const limited = visible.map((item) => {
      const first = item.posts.find((post) => post.replies.length)!;
      return { ...item, posts: [{ ...first, replies: [] }] };
    });
    let remaining = MAX_MESSAGES - limited.length;
    const queues = visible.map((item) => {
      const units: Array<{ kind: "reply"; postIndex: number; reply: Reply } | { kind: "post"; post: FeedPost }> = [];
      const active = item.posts.filter((post) => post.replies.length);
      for (const reply of active[0]?.replies ?? []) units.push({ kind: "reply", postIndex: 0, reply });
      for (const post of active.slice(1)) {
        units.push({ kind: "post", post: { ...post, replies: [] } });
        for (const reply of post.replies) units.push({ kind: "reply", postIndex: active.indexOf(post), reply });
      }
      return units;
    });
    while (remaining > 0) {
      let changed = false;
      for (let index = 0; index < queues.length && remaining > 0; index += 1) {
        const unit = queues[index].shift();
        if (!unit) continue;
        const cost = 1;
        if (cost > remaining) continue;
        if (unit.kind === "post") limited[index].posts.push(unit.post);
        else {
          const target = limited[index].posts[unit.postIndex];
          if (target) target.replies.push(unit.reply);
        }
        remaining -= cost;
        changed = true;
      }
      if (!changed) break;
    }
    return limited;
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
