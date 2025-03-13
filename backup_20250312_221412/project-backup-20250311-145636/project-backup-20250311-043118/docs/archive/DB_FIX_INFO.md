# Database Table Syntax Fix

This document explains the issue with the SQL syntax in the users table definition and how to fix it.

## The Problem

The users table definition contained an invalid SQL syntax with an extra closing square bracket after the proper closing parenthesis:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    reset_token VARCHAR(255) UNIQUE,
    verification_token VARCHAR(255) UNIQUE
)  -- Correct closing parenthesis
]  -- Extra invalid closing bracket
```

This extra closing bracket `]` is causing syntax errors when trying to create or modify the table.

## Solution Methods

### 1. Fix Migration Files

Run the `fix_migration_syntax.py` script to automatically scan and fix any migration files with this issue:

```bash
python fix_migration_syntax.py
```

This script:

- Searches for all migration files in the project
- Identifies files with the problematic syntax pattern
- Fixes the syntax by removing the extra closing bracket
- Updates the files in place

### 2. Direct Database Fix

If the table already exists in the database but has issues, run the `fix_users_table.py` script:

```bash
python fix_users_table.py
```

This script:

- Connects to the database using the `DATABASE_URL` environment variable
- Creates a backup of the users table data
- Drops the original table
- Creates a new table with the corrected syntax
- Restores the data from the backup
- Keeps the backup table as a safety measure

### 3. Manual Model Fix

If you need to fix the model definition directly, follow these steps:

1. Find your User model definition (app/models.py or backend/app/models/user.py)
2. Ensure there are no extra square brackets in the model definition
3. If using a SQLAlchemy model, it should look like:

```python
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String, unique=True, index=True, nullable=False)
    refresh_token = db.Column(db.String, nullable=True, unique=True)
    reset_token = db.Column(db.String, nullable=True, unique=True)
    verification_token = db.Column(db.String, nullable=True, unique=True)
    # other fields...
```

## Post-Fix Steps

After fixing the issue, you should:

1. Run a database migration to ensure everything is up to date:

   ```bash
   flask db migrate -m "Fix users table"
   flask db upgrade
   ```

2. Test the application to make sure everything works correctly

3. If you used the direct database fix, check that all data was preserved

## Preventing Future Issues

To prevent similar issues in the future:

1. Use SQLAlchemy models instead of raw SQL when possible
2. Include syntax validation in your CI/CD pipeline
3. Test migrations in a development environment before applying to production
4. Consider using a database migration tool like Alembic that provides more robust syntax checking

## Troubleshooting

If you encounter issues with the fix:

1. Check the logs of the fix scripts for any errors
2. Verify your database connection settings
3. Make sure you have the necessary permissions to modify the database
4. If you have foreign keys referencing the users table, you may need to drop those constraints first

For more help, refer to the project's troubleshooting page at `/troubleshoot` or contact the development team.
