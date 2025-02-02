import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_test_database():
    """Create test database if it doesn't exist."""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'harmonic_universe_test'")
        exists = cursor.fetchone()

        if not exists:
            # Create database
            cursor.execute('CREATE DATABASE harmonic_universe_test')
            print("Test database created successfully")
        else:
            print("Test database already exists")

    except Exception as e:
        print(f"Error setting up test database: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_test_database()
