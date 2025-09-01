-- SQLx migration: create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (expense_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);

-- Ensure columns exist on legacy DBs
ALTER TABLE IF EXISTS expense_splits
  ADD COLUMN IF NOT EXISTS expense_id UUID,
  ADD COLUMN IF NOT EXISTS member_id UUID,
  ADD COLUMN IF NOT EXISTS member_name TEXT,
  ADD COLUMN IF NOT EXISTS amount BIGINT;

