-- 1. Create Groups Table
CREATE TABLE IF NOT EXISTS finance_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Group Members Table (Many-to-Many relationship between Users and Groups)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES finance_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'editor', 'viewer')) NOT NULL DEFAULT 'editor',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- 3. Data Migration: Create a "Personal Group" for each existing user
DO $$
DECLARE
    user_rec RECORD;
    new_group_id UUID;
BEGIN
    FOR user_rec IN SELECT * FROM users LOOP
        -- Check if user already has a group (to be safe if run multiple times, though usually we'd use a separate migration table)
        -- For this script, we'll just create if they don't have membership in any group yet.
        IF NOT EXISTS (SELECT 1 FROM group_members WHERE user_id = user_rec.id) THEN
            
            -- Create Group
            INSERT INTO finance_groups (name) 
            VALUES ('Finanças de ' || user_rec.username)
            RETURNING id INTO new_group_id;

            -- Add User as Admin
            INSERT INTO group_members (group_id, user_id, role)
            VALUES (new_group_id, user_rec.id, 'admin');

            -- 4. Migrate Existing Data to this new Group
            -- We assume the tables exist as per 01-init.sql
            
            -- Add group_id column if not exists (we do this outside the loop normally, but need it here for the update)
            -- We'll do the ALTER TABLE outside the loop first.
        END IF;
    END LOOP;
END $$;

-- 4. Add group_id columns to financial tables
ALTER TABLE bills ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES finance_groups(id) ON DELETE CASCADE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES finance_groups(id) ON DELETE CASCADE;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES finance_groups(id) ON DELETE CASCADE;
ALTER TABLE random_expenses ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES finance_groups(id) ON DELETE CASCADE;

-- 5. Populate group_id for existing records
-- We map back via the user_id still present in the rows to find their PRIMARY group (the one we just created)
-- Note: This assumes 1:1 mapping for the migration.
UPDATE bills b
SET group_id = gm.group_id
FROM group_members gm
WHERE b.user_id = gm.user_id
AND b.group_id IS NULL;

UPDATE incomes i
SET group_id = gm.group_id
FROM group_members gm
WHERE i.user_id = gm.user_id
AND i.group_id IS NULL;

UPDATE investments inv
SET group_id = gm.group_id
FROM group_members gm
WHERE inv.user_id = gm.user_id
AND inv.group_id IS NULL;

UPDATE random_expenses r
SET group_id = gm.group_id
FROM group_members gm
WHERE r.user_id = gm.user_id
AND r.group_id IS NULL;

-- 6. Enforce NOT NULL on group_id (Optional: only if we want to strictly forbid orphan records)
-- ALTER TABLE bills ALTER COLUMN group_id SET NOT NULL;
-- (Skipping strict enforcement for now to avoid breaking if migration has edge cases, but in prod we would)

-- 7. Drop or Make Nullable the old user_id columns?
-- We will keep them for now as legacy/audit but the app will stop using them for ownership.
-- ALTER TABLE bills ALTER COLUMN user_id DROP NOT NULL;
