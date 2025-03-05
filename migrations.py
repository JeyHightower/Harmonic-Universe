import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('migrations')

def run_migrations():
    """Run database migrations"""
    try:
        # Get database URL from environment variable
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL not set")
            return False

        logger.info(f"Running migrations on {database_url.split('@')[1] if '@' in database_url else database_url}")

        # Connect to database
        engine = create_engine(database_url)

        # Check if migrations table exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'migrations'
                );
            """))
            table_exists = result.scalar()

            if not table_exists:
                logger.info("Creating migrations table")
                conn.execute(text("""
                    CREATE TABLE migrations (
                        id SERIAL PRIMARY KEY,
                        version VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()

        # Get the latest applied migration
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version FROM migrations ORDER BY id DESC LIMIT 1"))
            latest = result.scalar() or '0000'
            logger.info(f"Latest migration: {latest}")

        # Get list of migration files
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

        # Apply migrations in order
        for migration_file in migration_files:
            version = migration_file.split('_')[0]
            if version > latest:
                logger.info(f"Applying migration: {migration_file}")

                # Read migration file
                with open(os.path.join(migrations_dir, migration_file), 'r') as f:
                    migration_sql = f.read()

                # Apply migration
                with engine.begin() as conn:
                    conn.execute(text(migration_sql))
                    conn.execute(text("INSERT INTO migrations (version) VALUES (:version)"),
                                {"version": version})

                logger.info(f"Migration {migration_file} applied successfully")

        logger.info("All migrations applied successfully")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        return False

if __name__ == "__main__":
    if run_migrations():
        sys.exit(0)
    else:
        sys.exit(1)
