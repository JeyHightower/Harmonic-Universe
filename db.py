"""
Database module for Harmonic Universe
This file provides database connectivity and session management
"""
import os
import sys
import logging
import sqlite3
import importlib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

class Database:
    """Database wrapper that supports both SQLite and PostgreSQL"""

    def __init__(self, db_path='harmonic_universe.db'):
        """Initialize database connection"""
        self.db_path = db_path
        self.conn = None
        self.is_postgres = False

        # Check if PostgreSQL should be used
        self.database_url = os.environ.get('DATABASE_URL')
        if self.database_url and self.database_url.startswith('postgres'):
            self.is_postgres = True
            logger.info("PostgreSQL database detected")
        else:
            logger.info(f"SQLite database initialized with path: {db_path}")

    def connect(self):
        """Connect to the database"""
        if self.conn is None:
            try:
                if self.is_postgres:
                    # Try to import psycopg2
                    try:
                        import psycopg2
                        self.conn = psycopg2.connect(self.database_url)
                        self.conn.autocommit = True
                        logger.info("Connected to PostgreSQL database")
                    except ImportError:
                        # Try to install psycopg2-binary
                        logger.warning("psycopg2 not found, trying to install psycopg2-binary")
                        try:
                            import subprocess
                            subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
                            import psycopg2
                            self.conn = psycopg2.connect(self.database_url)
                            self.conn.autocommit = True
                            logger.info("Connected to PostgreSQL database after installing psycopg2-binary")
                        except Exception as e:
                            logger.error(f"Failed to install psycopg2-binary: {e}")
                            # Fall back to SQLite
                            self.is_postgres = False
                            self.conn = sqlite3.connect(self.db_path)
                            self.conn.row_factory = sqlite3.Row
                            logger.warning("Falling back to SQLite due to PostgreSQL connection issues")
                else:
                    self.conn = sqlite3.connect(self.db_path)
                    self.conn.row_factory = sqlite3.Row
                    logger.info("Connected to SQLite database")

                return True
            except Exception as e:
                logger.error(f"Error connecting to database: {e}")
                return False
        return True

    def close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Database connection closed")

    def create_tables(self):
        """Create database tables"""
        if not self.connect():
            return False

        try:
            cursor = self.conn.cursor()

            # Create alembic_version table first
            table_sql = '''
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num TEXT NOT NULL PRIMARY KEY
            )
            '''

            # Execute create table statements
            if self.is_postgres:
                cursor.execute(table_sql)

                # Insert migration version
                cursor.execute('''
                INSERT INTO alembic_version (version_num)
                VALUES ('60ebacf5d282')
                ON CONFLICT (version_num) DO NOTHING
                ''')
            else:
                cursor.execute(table_sql)

                # Insert migration version
                cursor.execute('''
                INSERT OR IGNORE INTO alembic_version (version_num)
                VALUES ('60ebacf5d282')
                ''')

            # Create users table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')

            # Create universes table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS universes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            ''')

            # Create scenes table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS scenes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                universe_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (universe_id) REFERENCES universes (id)
            )
            ''')

            self.conn.commit()
            logger.info("Database tables created")
            return True
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            return False

    def query(self, sql, params=()):
        """Execute a query and return all results"""
        if not self.connect():
            return []

        try:
            cursor = self.conn.cursor()
            cursor.execute(sql, params)
            return cursor.fetchall()
        except sqlite3.Error as e:
            logger.error(f"Query error: {e}")
            return []

    def execute(self, sql, params=()):
        """Execute a statement and commit changes"""
        if not self.connect():
            return False

        try:
            cursor = self.conn.cursor()
            cursor.execute(sql, params)
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            logger.error(f"Execute error: {e}")
            return False

# Create global database instance
db = Database()

# Initialize database tables
db.create_tables()
