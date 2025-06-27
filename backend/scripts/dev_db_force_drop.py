#!/usr/bin/env python3
"""
Force drop all tables with CASCADE for dev reset (handles circular dependencies).
"""
import os
import sys
import sqlalchemy
from sqlalchemy import text

# Load database URL from environment or use default
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://harmonic_user:harmonic_password@localhost:5432/harmonic_universe')

engine = sqlalchemy.create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Disabling all constraints...")
    conn.execute(text("SET session_replication_role = 'replica';"))
    print("Fetching all tables...")
    tables = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")).fetchall()
    for (table,) in tables:
        print(f"Dropping table: {table}")
        conn.execute(text(f"DROP TABLE IF EXISTS \"{table}\" CASCADE;"))
    print("Re-enabling constraints...")
    conn.execute(text("SET session_replication_role = 'origin';"))
    print("All tables dropped with CASCADE.")
