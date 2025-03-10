-- Emergency fix for "relation already exists" error
-- Run this in Render's database shell

-- Create alembic_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) PRIMARY KEY
);

-- Clear existing migration versions and set to the problematic migration ID
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num)
VALUES ('60ebacf5d282')
ON CONFLICT (version_num) DO NOTHING;

-- Verify the migration state is now correct
SELECT * FROM alembic_version;

-- Check if key tables exist
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users') AS users_table_exists,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='alembic_version') AS alembic_table_exists;
