-- Migration: rename_paid_by_column
-- Created: 2025-07-23

-- Up migration
-- Only rename if the old column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='paid_by_member_id') THEN
        ALTER TABLE expenses RENAME COLUMN paid_by_member_id TO paid_by_id;
    END IF;
END $$;

-- Update index name to match new column name
DROP INDEX IF EXISTS idx_expenses_paid_by;
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_id ON expenses(paid_by_id);

-- Update the amount column from DECIMAL to BIGINT for consistency with the newer schema
-- Also add the description column that was missing from the initial schema
DO $$
BEGIN
    -- Check if amount column is DECIMAL and convert to BIGINT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='amount' AND data_type='numeric') THEN
        ALTER TABLE expenses ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='description') THEN
        ALTER TABLE expenses ADD COLUMN description TEXT;
    END IF;
END $$;

-- Update the title column to use description instead if description doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='title') THEN
        UPDATE expenses SET description = title WHERE description IS NULL;
        ALTER TABLE expenses DROP COLUMN title;
    END IF;
END $$;

-- Down migration would be:
-- ALTER TABLE expenses RENAME COLUMN paid_by_id TO paid_by_member_id;
-- DROP INDEX IF EXISTS idx_expenses_paid_by_id;
-- CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_member_id);
-- ALTER TABLE expenses ALTER COLUMN amount TYPE DECIMAL(15, 2);
-- ALTER TABLE expenses ADD COLUMN title VARCHAR(255);
-- UPDATE expenses SET title = description;
-- ALTER TABLE expenses DROP COLUMN description;