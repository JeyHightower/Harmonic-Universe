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

Run in your Render shell:

```bash
python render_emergency_fix.py
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
