CREATE TABLE IF NOT EXISTS posts (
  id           TEXT       PRIMARY KEY    DEFAULT (uuid4()),
  user_id      TEXT       NOT NULL,
  body         TEXT       NOT NULL,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_media (
  id           TEXT       PRIMARY KEY    DEFAULT (uuid4()),
  post_id      TEXT       NOT NULL,
  media_url    TEXT       NOT NULL,
  media_type   TEXT       NOT NULL,
  file_key     TEXT       NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
