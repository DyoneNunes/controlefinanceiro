-- ============================================================================
-- Migration 12: Installment (Parcelamento) support for bills
-- ============================================================================
-- Adds optional columns to track installment groups.
-- NULL values mean the bill is a regular (non-installment) bill.

ALTER TABLE bills ADD COLUMN IF NOT EXISTS installment_group UUID;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS installment_total INTEGER;

-- Index for efficient lookups of installment groups
CREATE INDEX IF NOT EXISTS idx_bills_installment_group ON bills (installment_group) WHERE installment_group IS NOT NULL;
