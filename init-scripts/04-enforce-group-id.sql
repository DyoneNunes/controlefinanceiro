-- Migration 04: Enforce NOT NULL on group_id columns
-- This ensures no orphan records can exist without a group.

-- First, delete any orphan records that might exist
DELETE FROM bills WHERE group_id IS NULL;
DELETE FROM incomes WHERE group_id IS NULL;
DELETE FROM investments WHERE group_id IS NULL;
DELETE FROM random_expenses WHERE group_id IS NULL;

-- Then enforce NOT NULL
DO $$
BEGIN
    -- bills
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bills' AND column_name = 'group_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE bills ALTER COLUMN group_id SET NOT NULL;
    END IF;

    -- incomes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'incomes' AND column_name = 'group_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE incomes ALTER COLUMN group_id SET NOT NULL;
    END IF;

    -- investments
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'investments' AND column_name = 'group_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE investments ALTER COLUMN group_id SET NOT NULL;
    END IF;

    -- random_expenses
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'random_expenses' AND column_name = 'group_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE random_expenses ALTER COLUMN group_id SET NOT NULL;
    END IF;
END $$;
