-- EMERGENCY FIX FOR "RELATION ALREADY EXISTS" ERROR
-- Run this in your Render database shell

-- Create alembic_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    PRIMARY KEY (version_num)
);

-- Clear any existing versions and set to the specific problematic migration
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');

-- Verify it worked
SELECT * FROM alembic_version;
