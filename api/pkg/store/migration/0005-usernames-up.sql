CREATE TABLE IF NOT EXISTS users_temp (
  id           TEXT       PRIMARY KEY    DEFAULT (uuid4()),
  sub          TEXT       UNIQUE,
  verified     BOOLEAN,
  username     TEXT       UNIQUE,
  name         TEXT,
  email        TEXT,
  profile_picture_url TEXT,
  is_admin     BOOLEAN    DEFAULT FALSE,
  created_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
  updated_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
);

INSERT INTO users_temp (id, sub, verified, name, email, is_admin, created_at)
SELECT id, sub, verified, name, email, is_admin, created_at FROM users;
DROP TABLE users;
ALTER TABLE users_temp RENAME TO users;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
