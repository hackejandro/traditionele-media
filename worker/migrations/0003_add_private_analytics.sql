-- Migration number: 0003 	 2026-09-22T07:24:34.557Z

CREATE TABLE analytics_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen_date TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dedupe_key TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('pageview', 'conversation_open')),
  event_date TEXT NOT NULL,
  page_path TEXT NOT NULL,
  conversation_id TEXT,
  conversation_url TEXT,
  conversation_title TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_analytics_events_date_type
ON analytics_events(event_date, event_type, created_at);

CREATE INDEX idx_analytics_events_visitor_date
ON analytics_events(visitor_id, event_date);

CREATE INDEX idx_analytics_events_conversation
ON analytics_events(event_date, conversation_url, event_type);

PRAGMA optimize;
