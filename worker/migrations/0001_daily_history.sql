CREATE TABLE daily_link_snapshots (
  snapshot_date TEXT NOT NULL,
  link_id TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  conversation_count INTEGER NOT NULL CHECK (conversation_count >= 0),
  message_count INTEGER NOT NULL CHECK (message_count >= 0),
  unique_people_count INTEGER NOT NULL CHECK (unique_people_count >= 0),
  max_thread_messages INTEGER NOT NULL CHECK (max_thread_messages >= 0),
  first_seen_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  captured_at INTEGER NOT NULL,
  PRIMARY KEY (snapshot_date, link_id)
);

CREATE INDEX idx_daily_link_snapshots_date_conversations
ON daily_link_snapshots(snapshot_date, conversation_count DESC);

CREATE TABLE history_runs (
  snapshot_date TEXT PRIMARY KEY,
  last_capture_at INTEGER NOT NULL,
  stored_links INTEGER NOT NULL CHECK (stored_links >= 0),
  source_generated_at TEXT
);

PRAGMA optimize;
