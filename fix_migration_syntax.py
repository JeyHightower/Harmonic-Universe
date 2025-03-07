#!/usr/bin/env python
"""
Fix migration syntax error script
This script corrects the SQL syntax error in migration files where an extra
closing bracket ']' was added after the closing parenthesis in table definitions.
"""
import os
import re
import sys
import logging
import glob

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("migration_fix")

def find_migration_files():
    """Find all migration files in the project."""
    possible_migration_dirs = [
        'migrations/versions',
        'alembic/versions',
        'backend/migrations/versions',
        'app/migrations/versions',
        '**/migrations/versions'
    ]

    migration_files = []

    # Try each possible directory
    for path_pattern in possible_migration_dirs:
        found_files = glob.glob(path_pattern + '/*.py', recursive=True)
        if found_files:
            migration_files.extend(found_files)
            logger.info(f"Found {len(found_files)} migration files in {path_pattern}")

    # If still no files found, use recursive glob search
    if not migration_files:
        found_files = glob.glob('**/migrations/**/*.py', recursive=True)
        migration_files.extend(found_files)
        logger.info(f"Found {len(found_files)} migration files using recursive search")

    return migration_files

def fix_sql_syntax_error(file_path):
    """Fix SQL syntax error in a migration file."""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Define patterns to look for
        # This pattern matches table definitions with an extra closing bracket
        # after the last closing parenthesis
        pattern = r'\)\s*\]'

        # Check if the pattern exists in the file
        if re.search(pattern, content):
            # Fix the syntax by replacing ')]' with ')'
            fixed_content = re.sub(pattern, ')', content)

            # Write the fixed content back to the file
            with open(file_path, 'w') as f:
                f.write(fixed_content)

            logger.info(f"Fixed SQL syntax error in {file_path}")
            return True
        else:
            logger.info(f"No SQL syntax error found in {file_path}")
            return False

    except Exception as e:
        logger.error(f"Error fixing {file_path}: {e}")
        return False

def find_and_fix_errors_in_files():
    """Find and fix all SQL syntax errors in migration files."""
    migration_files = find_migration_files()

    if not migration_files:
        logger.warning("No migration files found")
        return False

    fixed_count = 0
    for file_path in migration_files:
        if fix_sql_syntax_error(file_path):
            fixed_count += 1

    logger.info(f"Fixed {fixed_count} files out of {len(migration_files)}")
    return fixed_count > 0

def fix_sql_file(file_path):
    """Fix SQL syntax error in a SQL file."""
    try:
        if not os.path.exists(file_path):
            logger.error(f"SQL file not found: {file_path}")
            return False

        with open(file_path, 'r') as f:
            content = f.read()

        # Define patterns to look for
        # This pattern matches table definitions with an extra closing bracket
        pattern = r'UNIQUE\s*\(\s*verification_token\s*\)\s*\)'

        # Check if the pattern exists in the file
        if pattern in content and content.endswith(']'):
            # Fix the syntax by removing the extra bracket
            fixed_content = content.rstrip(']').strip() + ';'

            # Write the fixed content back to the file
            with open(file_path, 'w') as f:
                f.write(fixed_content)

            logger.info(f"Fixed SQL syntax error in {file_path}")
            return True
        else:
            logger.info(f"No SQL syntax error found in {file_path}")
            return False

    except Exception as e:
        logger.error(f"Error fixing {file_path}: {e}")
        return False

def check_model_file(file_path):
    """Check a model file for potential issues."""
    if not os.path.exists(file_path):
        logger.error(f"Model file not found: {file_path}")
        return

    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Look for potential issues in model definitions
        if 'verification_token' in content:
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'verification_token' in line and ']' in line:
                    logger.warning(f"Potential issue in {file_path} at line {i+1}: {line}")
    except Exception as e:
        logger.error(f"Error checking {file_path}: {e}")

def main():
    """Main function to find and fix SQL syntax errors."""
    logger.info("Starting migration syntax fix")

    # First check model definitions
    model_files = [
        'app/models.py',
        'models.py',
        'backend/app/models/user.py',
        'backend/app/models.py'
    ]

    for model_file in model_files:
        check_model_file(model_file)

    # Fix errors in migration files
    fixed = find_and_fix_errors_in_files()

    # Additional direct fix for SQL files
    sql_files = glob.glob('**/*.sql', recursive=True)
    for sql_file in sql_files:
        if 'users' in sql_file.lower() and 'create' in sql_file.lower():
            fix_sql_file(sql_file)

    if fixed:
        logger.info("SQL syntax errors fixed successfully")
    else:
        logger.info("No SQL syntax errors found or fixed")

if __name__ == "__main__":
    main()
