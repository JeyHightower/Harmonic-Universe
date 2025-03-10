#!/usr/bin/env python3
"""Database creation script."""

import sys
import logging
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from backend.app.core.config import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database(env='development'):
    """Create database if it doesn't exist."""
    cfg = config[env]
    db_url = cfg.SQLALCHEMY_DATABASE_URI
    db_name = db_url.split('/')[-1]

    # Create connection string for postgres database
    postgres_url = '/'.join(db_url.split('/')[:-1] + ['postgres'])

    try:
        # Connect to postgres database
        conn = psycopg2.connect(postgres_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f'CREATE DATABASE {db_name}')
            logger.info(f"Created database {db_name}")
        else:
            logger.info(f"Database {db_name} already exists")

    except psycopg2.Error as e:
        logger.error(f"Error creating database: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

def main():
    """Main entry point."""
    import argparse
    parser = argparse.ArgumentParser(description='Create database')
    parser.add_argument('--env', choices=['development', 'testing', 'production'],
                      default='development', help='Environment to create database for')
    args = parser.parse_args()

    create_database(args.env)

if __name__ == '__main__':
    main()
