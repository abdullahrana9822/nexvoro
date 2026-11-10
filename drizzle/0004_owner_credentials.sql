-- Additive only: preserve all existing users, sessions, products and orders.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (lower(username)) WHERE username IS NOT NULL;
