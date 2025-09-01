-- SQLx migration: create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);

-- Ensure columns exist on legacy DBs
ALTER TABLE IF EXISTS members
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;

