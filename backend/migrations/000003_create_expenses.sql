-- SQLx migration: create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  paid_by_id UUID NOT NULL,
  paid_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_id ON expenses(paid_by_id);

-- Ensure columns exist on legacy DBs
ALTER TABLE IF EXISTS expenses
  ADD COLUMN IF NOT EXISTS amount BIGINT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS paid_by_id UUID,
  ADD COLUMN IF NOT EXISTS paid_by_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

