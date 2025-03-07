#!/usr/bin/env python
"""
Fix Users Table Script

This script fixes the users table by recreating it with the correct syntax.
Use this when your table definition has a syntax error with an extra closing bracket.
"""
import os
import sys
import logging
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("db_fix")

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set")
    sys.exit(1)

# Mask password in logs
masked_url = DATABASE_URL
if "@" in DATABASE_URL:
    parts = DATABASE_URL.split('@')
    if '://' in parts[0]:
        protocol_parts = parts[0].split('://')
        masked_url = f"{protocol_parts[0]}://****:****@{parts[1]}"

logger.info(f"Using database URL: {masked_url}")

def check_table_exists(engine, table_name):
    """Check if a table exists in the database."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = :table_name)"
            ), {"table_name": table_name})
            exists = result.scalar()
            logger.info(f"Table '{table_name}' exists: {exists}")
            return exists
    except Exception as e:
        logger.error(f"Error checking if table exists: {e}")
        return False

def get_table_columns(engine, table_name):
    """Get the columns and their definitions from a table."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT column_name, data_type, character_maximum_length, "
                "is_nullable, column_default "
                "FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = :table_name "
                "ORDER BY ordinal_position"
            ), {"table_name": table_name})

            columns = []
            for row in result:
                column = {
                    "name": row[0],
                    "type": row[1],
                    "length": row[2],
                    "nullable": row[3] == 'YES',
                    "default": row[4]
                }
                columns.append(column)

            return columns
    except Exception as e:
        logger.error(f"Error getting table columns: {e}")
        return []

def get_table_constraints(engine, table_name):
    """Get the constraints for a table."""
    try:
        with engine.connect() as conn:
            # Get primary key
            pk_result = conn.execute(text(
                "SELECT c.column_name "
                "FROM information_schema.table_constraints tc "
                "JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) "
                "JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema "
                "AND c.table_name = tc.table_name AND c.column_name = ccu.column_name "
                "WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = :table_name"
            ), {"table_name": table_name})

            primary_keys = [row[0] for row in pk_result]

            # Get unique constraints
            unique_result = conn.execute(text(
                "SELECT c.column_name "
                "FROM information_schema.table_constraints tc "
                "JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) "
                "JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema "
                "AND c.table_name = tc.table_name AND c.column_name = ccu.column_name "
                "WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = :table_name"
            ), {"table_name": table_name})

            unique_constraints = [row[0] for row in unique_result]

            # Get foreign keys
            fk_result = conn.execute(text(
                "SELECT kcu.column_name, ccu.table_name AS foreign_table_name, "
                "ccu.column_name AS foreign_column_name "
                "FROM information_schema.table_constraints AS tc "
                "JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name "
                "JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name "
                "WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = :table_name"
            ), {"table_name": table_name})

            foreign_keys = []
            for row in fk_result:
                fk = {
                    "column": row[0],
                    "references_table": row[1],
                    "references_column": row[2]
                }
                foreign_keys.append(fk)

            return {
                "primary_keys": primary_keys,
                "unique_constraints": unique_constraints,
                "foreign_keys": foreign_keys
            }
    except Exception as e:
        logger.error(f"Error getting table constraints: {e}")
        return {"primary_keys": [], "unique_constraints": [], "foreign_keys": []}

def backup_table_data(engine, table_name):
    """Backup table data to a temporary table."""
    temp_table = f"{table_name}_backup"
    try:
        with engine.connect() as conn:
            # Drop temporary table if it exists
            conn.execute(text(f"DROP TABLE IF EXISTS {temp_table}"))
            conn.commit()

            # Create temporary table with same structure
            conn.execute(text(f"CREATE TABLE {temp_table} AS SELECT * FROM {table_name}"))
            conn.commit()

            # Get count of backed up rows
            result = conn.execute(text(f"SELECT COUNT(*) FROM {temp_table}"))
            count = result.scalar()

            logger.info(f"Backed up {count} rows from {table_name} to {temp_table}")
            return True
    except Exception as e:
        logger.error(f"Error backing up table data: {e}")
        return False

def restore_table_data(engine, source_table, target_table):
    """Restore data from source table to target table."""
    try:
        with engine.connect() as conn:
            # Get column names
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = :table_name "
                "ORDER BY ordinal_position"
            ), {"table_name": source_table})

            columns = [row[0] for row in result]
            columns_str = ", ".join(columns)

            # Insert data from source to target
            conn.execute(text(f"INSERT INTO {target_table} ({columns_str}) SELECT {columns_str} FROM {source_table}"))
            conn.commit()

            # Get count of restored rows
            result = conn.execute(text(f"SELECT COUNT(*) FROM {target_table}"))
            count = result.scalar()

            logger.info(f"Restored {count} rows from {source_table} to {target_table}")
            return True
    except Exception as e:
        logger.error(f"Error restoring table data: {e}")
        return False

def recreate_users_table(engine):
    """Recreate the users table with the correct definition."""
    try:
        # First check if the table exists
        if not check_table_exists(engine, "users"):
            logger.error("Users table does not exist")
            return False

        # Backup existing data
        backup_success = backup_table_data(engine, "users")
        if not backup_success:
            logger.error("Failed to backup users table data")
            return False

        # Get table columns and constraints
        columns = get_table_columns(engine, "users")
        constraints = get_table_constraints(engine, "users")

        if not columns:
            logger.error("Failed to get users table columns")
            return False

        # Create the new table definition
        column_defs = []
        for column in columns:
            col_type = column["type"]
            if column["length"]:
                col_type = f"{col_type}({column['length']})"

            nullable = "NULL" if column["nullable"] else "NOT NULL"
            default = f"DEFAULT {column['default']}" if column['default'] else ""

            column_def = f"{column['name']} {col_type} {nullable} {default}".strip()
            column_defs.append(column_def)

        # Add primary key constraint
        if constraints["primary_keys"]:
            pk_columns = ", ".join(constraints["primary_keys"])
            column_defs.append(f"PRIMARY KEY ({pk_columns})")

        # Add unique constraints
        for column in constraints["unique_constraints"]:
            column_defs.append(f"UNIQUE ({column})")

        # Create table definition
        table_def = f"CREATE TABLE users_new (\n    " + ",\n    ".join(column_defs) + "\n)"

        with engine.connect() as conn:
            # Drop the new table if it exists
            conn.execute(text("DROP TABLE IF EXISTS users_new"))
            conn.commit()

            # Create the new table
            conn.execute(text(table_def))
            conn.commit()

            logger.info("Created new users table with correct definition")

            # Restore data
            restore_success = restore_table_data(engine, "users_backup", "users_new")
            if not restore_success:
                logger.error("Failed to restore users table data")
                return False

            # Drop the old table and rename the new one
            conn.execute(text("DROP TABLE users"))
            conn.execute(text("ALTER TABLE users_new RENAME TO users"))
            conn.commit()

            logger.info("Successfully recreated users table with correct definition")

            # Optionally drop the backup table
            #conn.execute(text("DROP TABLE users_backup"))
            #conn.commit()

            return True
    except Exception as e:
        logger.error(f"Error recreating users table: {e}")
        return False

def main():
    """Main function to fix the users table."""
    logger.info("Starting users table fix")

    try:
        # Create engine
        engine = create_engine(DATABASE_URL)

        # Check connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")

        # Recreate users table
        success = recreate_users_table(engine)

        if success:
            logger.info("Users table fixed successfully")
            return 0
        else:
            logger.error("Failed to fix users table")
            return 1

    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
