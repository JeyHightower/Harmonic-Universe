"""Database management utilities."""

from typing import Optional, List, Dict, Any
from sqlalchemy import text, inspect, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os

from ..core.logging import get_logger

logger = get_logger(__name__)

class DatabaseManager:
    """Database management utilities."""

    def __init__(self, db_engine: Optional[Engine] = None):
        """Initialize database manager."""
        if db_engine:
            self.engine = db_engine
        else:
            database_url = os.getenv(
                'DATABASE_URL',
                'postgresql://postgres:postgres@localhost:5432/harmonic_universe_dev'
            )
            if 'db:5432' in database_url:
                database_url = database_url.replace('db:5432', 'localhost:5432')
            self.engine = create_engine(database_url)

        self.inspector = inspect(self.engine)

    def get_table_info(self) -> List[Dict[str, Any]]:
        """Get information about all tables in the database."""
        tables = []
        for table_name in self.inspector.get_table_names():
            columns = self.inspector.get_columns(table_name)
            indexes = self.inspector.get_indexes(table_name)
            foreign_keys = self.inspector.get_foreign_keys(table_name)

            tables.append({
                'name': table_name,
                'columns': [
                    {
                        'name': col['name'],
                        'type': str(col['type']),
                        'nullable': col['nullable']
                    }
                    for col in columns
                ],
                'indexes': [
                    {
                        'name': idx['name'],
                        'columns': idx['column_names'],
                        'unique': idx['unique']
                    }
                    for idx in indexes
                ],
                'foreign_keys': [
                    {
                        'referred_table': fk['referred_table'],
                        'referred_columns': fk['referred_columns'],
                        'constrained_columns': fk['constrained_columns']
                    }
                    for fk in foreign_keys
                ]
            })
        return tables

    def backup_database(self, backup_dir: str = "backups") -> str:
        """Create a database backup."""
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(backup_dir, f"backup_{timestamp}.json")

        try:
            with Session(self.engine) as db:
                tables = self.get_table_info()
                data = {}

                for table in tables:
                    query = text(f"SELECT * FROM {table['name']}")
                    result = db.execute(query)
                    data[table['name']] = [dict(row) for row in result]

            with open(backup_file, 'w') as f:
                json.dump({
                    'metadata': {
                        'timestamp': timestamp,
                        'tables': tables
                    },
                    'data': data
                }, f, indent=2, default=str)

            logger.info(f"Database backup created: {backup_file}")
            return backup_file

        except Exception as e:
            logger.error(f"Failed to create database backup: {str(e)}")
            raise

    def restore_database(self, backup_file: str) -> None:
        """Restore database from backup."""
        try:
            with open(backup_file, 'r') as f:
                backup = json.load(f)

            with Session(self.engine) as db:
                for table_name, records in backup['data'].items():
                    # Clear existing data
                    db.execute(text(f"DELETE FROM {table_name}"))

                    # Insert backup data
                    if records:
                        columns = records[0].keys()
                        placeholders = ', '.join([f":{col}" for col in columns])
                        query = text(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})")

                        for record in records:
                            db.execute(query, record)

                db.commit()
                logger.info(f"Database restored from backup: {backup_file}")

        except Exception as e:
            logger.error(f"Failed to restore database: {str(e)}")
            raise

    def vacuum_database(self) -> None:
        """Perform database maintenance (VACUUM)."""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("VACUUM ANALYZE"))
            logger.info("Database vacuum completed successfully")
        except Exception as e:
            logger.error(f"Failed to vacuum database: {str(e)}")
            raise

    def check_database_health(self) -> Dict[str, Any]:
        """Check database health and return metrics."""
        try:
            with Session(self.engine) as db:
                # Check connection
                db.execute(text("SELECT 1"))

                # Get table sizes and row counts
                tables = self.get_table_info()
                table_stats = {}

                for table in tables:
                    result = db.execute(text(f"SELECT COUNT(*) FROM {table['name']}"))
                    row_count = result.scalar()
                    table_stats[table['name']] = {
                        'row_count': row_count,
                        'columns': len(table['columns']),
                        'indexes': len(table['indexes'])
                    }

                return {
                    'status': 'healthy',
                    'timestamp': datetime.now().isoformat(),
                    'table_stats': table_stats
                }

        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }

# Initialize database manager
db_manager = DatabaseManager()
