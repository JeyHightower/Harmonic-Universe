"""
Database module for Harmonic Universe
This file provides database connectivity and session management
"""
import os
import sqlite3
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

class Database:
    """Simple SQLite database wrapper"""

    def __init__(self, db_path='harmonic_universe.db'):
        """Initialize database connection"""
        self.db_path = db_path
        self.conn = None
        logger.info(f"Database initialized with path: {db_path}")

    def connect(self):
        """Connect to the database"""
        if self.conn is None:
            try:
                self.conn = sqlite3.connect(self.db_path)
                self.conn.row_factory = sqlite3.Row
                logger.info("Connected to database")
                return True
            except sqlite3.Error as e:
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

            # Create migrations table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num TEXT NOT NULL PRIMARY KEY
            )
            ''')

            # Insert initial migration version
            cursor.execute('''
            INSERT OR IGNORE INTO alembic_version (version_num) VALUES ('60ebacf5d282')
            ''')

            self.conn.commit()
            logger.info("Database tables created")
            return True
        except sqlite3.Error as e:
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
