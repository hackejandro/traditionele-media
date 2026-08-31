CREATE TABLE links (
  id BIGSERIAL PRIMARY KEY,
  normalized_url TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  host TEXT NOT NULL,
  title TEXT,
  description TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  uri TEXT PRIMARY KEY,
  cid TEXT NOT NULL,
  author_did TEXT NOT NULL,
  text TEXT NOT NULL,
  langs TEXT[] NOT NULL,
  root_uri TEXT,
  parent_uri TEXT,
  source_client TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE post_links (
  post_uri TEXT NOT NULL REFERENCES posts(uri) ON DELETE CASCADE,
  link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  is_origin BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (post_uri, link_id)
);

CREATE INDEX posts_root_uri_idx ON posts(root_uri);
CREATE INDEX posts_parent_uri_idx ON posts(parent_uri);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX post_links_link_id_idx ON post_links(link_id);
