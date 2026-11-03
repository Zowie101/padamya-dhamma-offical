-- Private backend schema. Keep this schema out of Supabase's exposed API schemas.
CREATE SCHEMA IF NOT EXISTS padamya;
REVOKE ALL ON SCHEMA padamya FROM PUBLIC;
CREATE TABLE IF NOT EXISTS padamya.profiles (
  id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK(role IN ('guest','customer','admin')), created_at TEXT NOT NULL,
  CHECK(email IS NULL OR email=lower(email))
);
CREATE TABLE IF NOT EXISTS padamya.sessions (
  token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES padamya.profiles(id),
  csrf TEXT NOT NULL,expires BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON padamya.sessions(expires);
CREATE TABLE IF NOT EXISTS padamya.products(id TEXT PRIMARY KEY,data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS padamya.saved_delivery(user_id TEXT PRIMARY KEY REFERENCES padamya.profiles(id),data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS padamya.carts(user_id TEXT PRIMARY KEY REFERENCES padamya.profiles(id),data JSONB NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS padamya.wishlists(user_id TEXT PRIMARY KEY REFERENCES padamya.profiles(id),data JSONB NOT NULL DEFAULT '[]');
CREATE TABLE IF NOT EXISTS padamya.orders (
  ref TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES padamya.profiles(id),data JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,request_hash TEXT NOT NULL,UNIQUE(user_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS orders_owner ON padamya.orders(user_id);
CREATE TABLE IF NOT EXISTS padamya.limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS padamya.media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,filename TEXT NOT NULL,owner_id TEXT NOT NULL REFERENCES padamya.profiles(id),created_at TEXT NOT NULL,storage_path TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS padamya.schema_migrations(version INTEGER PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
INSERT INTO padamya.schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
-- These are accessed only through the authenticated Node backend. Defense in depth
-- against accidentally exposing the schema through the Supabase Data API.
ALTER TABLE padamya.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.saved_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE padamya.media ENABLE ROW LEVEL SECURITY;
