DROP INDEX IF EXISTS idx_users_username;

CREATE TABLE IF NOT EXISTS users_temp (
  id           TEXT         PRIMARY KEY    DEFAULT (uuid4()),
  sub          TEXT         UNIQUE,
  verified     BOOLEAN,
  name         TEXT,
  email        TEXT,
  is_admin     BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_temp (id, sub, verified, name, email, is_admin, created_at)
SELECT id, sub, verified, name, email, is_admin, created_at FROM users;

DROP TABLE IF EXISTS users;

ALTER TABLE users_temp RENAME TO users;