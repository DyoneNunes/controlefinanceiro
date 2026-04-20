-- ============================================================================
-- Migration 13: Add status and received_date to incomes table
-- ============================================================================
-- Adds payment tracking to incomes, similar to bills and random_expenses.

ALTER TABLE incomes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'received'));
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS received_date TIMESTAMP WITH TIME ZONE;
