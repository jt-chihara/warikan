-- Migration: rename_paid_by_column
-- Created: 2025-07-23

-- Up migration
ALTER TABLE expenses RENAME COLUMN paid_by_member_id TO paid_by_id;

-- Update index name to match new column name
DROP INDEX IF EXISTS idx_expenses_paid_by;
CREATE INDEX idx_expenses_paid_by_id ON expenses(paid_by_id);

-- Update the amount column from DECIMAL to BIGINT for consistency with the newer schema
-- Also add the description column that was missing from the initial schema
ALTER TABLE expenses 
    ALTER COLUMN amount TYPE BIGINT,
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Update the title column to use description instead if description doesn't exist
UPDATE expenses SET description = title WHERE description IS NULL;

-- Remove the title column as it's replaced by description
ALTER TABLE expenses DROP COLUMN IF EXISTS title;

-- Down migration would be:
-- ALTER TABLE expenses RENAME COLUMN paid_by_id TO paid_by_member_id;
-- DROP INDEX IF EXISTS idx_expenses_paid_by_id;
-- CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_member_id);
-- ALTER TABLE expenses ALTER COLUMN amount TYPE DECIMAL(15, 2);
-- ALTER TABLE expenses ADD COLUMN title VARCHAR(255);
-- UPDATE expenses SET title = description;
-- ALTER TABLE expenses DROP COLUMN description;