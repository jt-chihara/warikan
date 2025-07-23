-- Migration: fix_expense_splits_amount_type
-- Created: 2025-07-23

-- Up migration
-- Convert existing DECIMAL amounts to BIGINT (multiply by 100 to convert to cents)
ALTER TABLE expense_splits 
    ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;

-- Remove the percentage column as it's not used in the current implementation
ALTER TABLE expense_splits DROP COLUMN IF EXISTS percentage;

-- Down migration would be:
-- ALTER TABLE expense_splits ALTER COLUMN amount TYPE DECIMAL(15, 2) USING (amount / 100.0)::DECIMAL(15, 2);
-- ALTER TABLE expense_splits ADD COLUMN percentage DECIMAL(5, 2);