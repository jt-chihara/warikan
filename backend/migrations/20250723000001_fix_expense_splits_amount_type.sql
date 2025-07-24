-- Migration: fix_expense_splits_amount_type
-- Created: 2025-07-23

-- Up migration
-- Convert existing DECIMAL amounts to BIGINT (multiply by 100 to convert to cents)
DO $$
BEGIN
    -- Check if amount column is DECIMAL and convert to BIGINT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expense_splits' AND column_name='amount' AND data_type='numeric') THEN
        ALTER TABLE expense_splits ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
    END IF;
END $$;

-- Remove the percentage column as it's not used in the current implementation
ALTER TABLE expense_splits DROP COLUMN IF EXISTS percentage;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='expense_splits_expense_id_member_id_key' AND table_name='expense_splits') THEN
        ALTER TABLE expense_splits ADD CONSTRAINT expense_splits_expense_id_member_id_key UNIQUE(expense_id, member_id);
    END IF;
END $$;

-- Down migration would be:
-- ALTER TABLE expense_splits ALTER COLUMN amount TYPE DECIMAL(15, 2) USING (amount / 100.0)::DECIMAL(15, 2);
-- ALTER TABLE expense_splits ADD COLUMN percentage DECIMAL(5, 2);