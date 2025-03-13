# Quick Reference: Fixing "Relation Already Exists" Errors on Render

## Option 1: Direct Database Fix (Fastest Solution)

Run these SQL commands in the Render database shell:

```sql
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    PRIMARY KEY (version_num)
);

DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('60ebacf5d282');

SELECT * FROM alembic_version;
```

## Option 2: Use the Verification Tool

1. Upload `render_verify.py` to your Render instance
2. Run: `python render_verify.py`
3. Follow the recommendations in the report

## Option 3: Use the WSGI Wrapper (Permanent Fix)

1. Add `wsgi_wrapper.py` to your repository
2. Update your `render.yaml` to use: `startCommand: gunicorn wsgi_wrapper:app`
3. Commit and redeploy

## Option 4: Emergency Fix Script

1. Upload `render_emergency_fix.py` to your Render instance
2. Make it executable: `chmod +x render_emergency_fix.py`
3. Run: `./render_emergency_fix.py`
4. Review the output for detailed information
5. If you need to specify a custom migration ID: `./render_emergency_fix.py YOUR_MIGRATION_ID`

The script will:

- Check database connectivity
- Create the alembic_version table if needed
- Set the migration version to '60ebacf5d282'
- Verify the fix was applied correctly
- Provide a detailed report

## Option 5: Migration State Checker

Run this diagnostic and fix tool:

```bash
# Check and diagnose without making changes
./check_migration_state.py

# Automatically apply fixes
./check_migration_state.py --auto-fix

# Save detailed report
./check_migration_state.py --output report.txt
```

## Explanation

These solutions work by:

1. Creating the `alembic_version` table (migration tracking)
2. Setting it to the specific migration ID of the problematic migration
3. This tells the migration system not to create tables that already exist

## Verification After Fix

Run this command to verify the fix worked:

```bash
psql $DATABASE_URL -c "SELECT * FROM alembic_version;"
```

You should see:

```
 version_num
--------------
 60ebacf5d282
(1 row)
```
