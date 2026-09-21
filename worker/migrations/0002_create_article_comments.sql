-- Migration number: 0002 	 2026-09-21T11:13:56.418Z

CREATE TABLE article_comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  parent_id TEXT REFERENCES article_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1200),
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden'))
);

CREATE INDEX idx_article_comments_location
ON article_comments(article_id, revision_id, paragraph_id, created_at);

CREATE INDEX idx_article_comments_parent
ON article_comments(parent_id);

PRAGMA optimize;
