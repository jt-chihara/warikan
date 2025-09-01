-- PostgreSQL schema for Warikan App
-- This file is executed by Docker entrypoint on first DB init
-- Mounted via docker-compose at ./backend/migrations:/docker-entrypoint-initdb.d

-- Ensure we are in public schema
SET search_path TO public;

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'JPY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);

-- Expenses
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

-- Expense Splits (one row per member per expense)
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (expense_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);

-- Optional: keep updated_at in sync at DB level (simple trigger)
-- Note: Requires superuser to create functions in some environments; comment out if undesired.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_groups_set_updated_at'
  ) THEN
    CREATE TRIGGER tr_groups_set_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

