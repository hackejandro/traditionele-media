(() => {
  if (location.protocol === 'file:') return;

  const ENDPOINT = 'https://commonplace-stream.alejandrotauber.workers.dev/analytics';
  const VISITOR_KEY = 'traditionele-media-analytics-id-v1';
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  function visitorId() {
    try {
      const stored = localStorage.getItem(VISITOR_KEY);
      if (stored && UUID.test(stored)) return stored;
      const created = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, created);
      return created;
    }
    catch {
      return crypto.randomUUID();
    }
  }

  function track(eventType, details = {}) {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        visitorId: visitorId(),
        eventType,
        pagePath: location.pathname || '/',
        ...details
      }),
      keepalive: true
    }).catch(() => {});
  }

  window.traditioneleMediaAnalytics = {track};
  track('pageview');
})();
