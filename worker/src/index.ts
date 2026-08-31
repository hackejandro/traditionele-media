const ALLOWED_ORIGINS = new Set([
  "https://hackejandro.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

const JETSTREAM_ENDPOINT = "wss://jetstream2.us-east.bsky.network/subscribe";
const MAX_LOOKBACK_MS = 10 * 60 * 1000;

type JetstreamEvent = {
  did?: string;
  time_us?: number;
  kind?: string;
  commit?: {
    operation?: string;
    collection?: string;
    rkey?: string;
    record?: {
      langs?: string[];
      text?: string;
      createdAt?: string;
      facets?: Array<{ features?: Array<{ uri?: string }> }>;
      embed?: { external?: { uri?: string; title?: string; description?: string } };
      reply?: { root?: { uri?: string }; parent?: { uri?: string } };
    };
  };
};

function isExplicitlyDutch(event: JetstreamEvent): boolean {
  const langs = event.commit?.record?.langs;
  return (
    Array.isArray(langs) &&
    langs.some((lang) => lang.toLowerCase().split("-")[0] === "nl")
  );
}

function hasLink(event: JetstreamEvent): boolean {
  const record = event.commit?.record;
  if (record?.embed?.external?.uri) return true;
  return Boolean(
    record?.facets?.some((facet) =>
      facet.features?.some((feature) => Boolean(feature.uri)),
    ),
  );
}

function shouldForward(event: JetstreamEvent): boolean {
  return (
    event.kind === "commit" &&
    event.commit?.collection === "app.bsky.feed.post" &&
    ["create", "update"].includes(event.commit.operation ?? "") &&
    isExplicitlyDutch(event) &&
    hasLink(event)
  );
}

function closeSocket(socket: WebSocket, code: number, reason: string): void {
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close(code, reason);
  }
}

async function openStream(request: Request): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response("Origin niet toegestaan", { status: 403 });
  }

  const [browserSocket, workerSocket] = Object.values(new WebSocketPair());
  workerSocket.accept({ allowHalfOpen: true });

  const requestUrl = new URL(request.url);
  const now = Date.now();
  const requestedCursor = Number(requestUrl.searchParams.get("cursor"));
  const earliestCursor = Math.trunc((now - MAX_LOOKBACK_MS) * 1000);
  const cursor = Number.isFinite(requestedCursor)
    ? Math.max(earliestCursor, Math.min(Math.trunc(now * 1000), requestedCursor))
    : Math.trunc((now - 3 * 60 * 1000) * 1000);
  const jetstreamUrl = new URL(JETSTREAM_ENDPOINT);
  jetstreamUrl.searchParams.append("wantedCollections", "app.bsky.feed.post");
  jetstreamUrl.searchParams.set("maxMessageSizeBytes", "50000");
  jetstreamUrl.searchParams.set("cursor", String(cursor));

  const upstream = new WebSocket(jetstreamUrl);

  upstream.addEventListener("open", () => {
    workerSocket.send(JSON.stringify({ type: "status", status: "live" }));
  });

  upstream.addEventListener("message", (message) => {
    if (typeof message.data !== "string") return;
    try {
      const event = JSON.parse(message.data) as JetstreamEvent;
      if (shouldForward(event) && workerSocket.readyState === WebSocket.OPEN) {
        workerSocket.send(message.data);
      }
    } catch {
      // Een ongeldig frame wordt genegeerd; de live verbinding blijft actief.
    }
  });

  upstream.addEventListener("close", () => {
    closeSocket(workerSocket, 1012, "Jetstream opnieuw verbinden");
  });

  upstream.addEventListener("error", () => {
    closeSocket(workerSocket, 1011, "Jetstream niet bereikbaar");
  });

  workerSocket.addEventListener("close", () => {
    closeSocket(upstream, 1000, "Browser gesloten");
  });

  workerSocket.addEventListener("error", () => {
    closeSocket(upstream, 1011, "Browserverbinding mislukt");
  });

  return new Response(null, { status: 101, webSocket: browserSocket });
}

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json(
        { ok: true, source: "ATProto Jetstream", languageRule: "record.langs = nl" },
        {
          headers: {
            "Access-Control-Allow-Origin": "https://hackejandro.github.io",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (url.pathname !== "/stream") {
      return new Response("Commonplace live stream", { status: 200 });
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket vereist", { status: 426 });
    }

    return openStream(request);
  },
} satisfies ExportedHandler;
