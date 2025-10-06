CREATE TABLE IF NOT EXISTS post_likes (
  id           TEXT       PRIMARY KEY    DEFAULT (uuid4()),
  post_id      TEXT       NOT NULL,
  user_id      TEXT       NOT NULL,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);
