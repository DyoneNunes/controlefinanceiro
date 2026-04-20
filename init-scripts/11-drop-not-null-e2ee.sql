-- E2EE Consequence Fixes
-- When E2EE is enabled, the sensitive fields are moved to encrypted_data.
-- The endpoints now submit NULL for these text columns. Hence, we must drop the NOT NULL constraint.

ALTER TABLE bills ALTER COLUMN name DROP NOT NULL;
ALTER TABLE incomes ALTER COLUMN description DROP NOT NULL;
ALTER TABLE investments ALTER COLUMN name DROP NOT NULL;
ALTER TABLE random_expenses ALTER COLUMN name DROP NOT NULL;
