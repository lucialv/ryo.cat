CREATE TABLE IF NOT EXISTS users (
  id           TEXT       PRIMARY KEY    DEFAULT (uuid4()),
  sub          TEXT       UNIQUE,
  verified     BOOLEAN,
  name         TEXT,
  email        TEXT,
  is_admin     BOOLEAN    DEFAULT FALSE,
  created_at   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
);
