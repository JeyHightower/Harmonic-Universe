"""
PostgreSQL fallback connection module
This module provides fallback connection capabilities for PostgreSQL
when the standard psycopg2 module fails to initialize properly.
"""
import os
import logging
import importlib.util
import sys

logger = logging.getLogger(__name__)

def get_pg_connection(db_url=None):
    """
    Attempt to get a PostgreSQL connection using various adapters.
    Returns the connection object or None if all attempts fail.
    """
    if not db_url:
        db_url = os.environ.get('DATABASE_URL')

    if not db_url:
        logger.error("No DATABASE_URL provided")
        return None

    # Try multiple PostgreSQL adapters in order of preference
    adapters = [
        ('psycopg2', _connect_with_psycopg2),
        ('pg8000', _connect_with_pg8000),
        ('psycopg', _connect_with_psycopg3)
    ]

    for adapter_name, connect_func in adapters:
        try:
            if _is_module_available(adapter_name):
                logger.info(f"Attempting connection with {adapter_name}")
                conn = connect_func(db_url)
                if conn:
                    logger.info(f"Successfully connected using {adapter_name}")
                    return conn
        except Exception as e:
            logger.error(f"Error connecting with {adapter_name}: {e}")

    # If we get here, all connection attempts failed
    logger.error("All PostgreSQL connection attempts failed")
    return None

def _is_module_available(module_name):
    """Check if a module is available without importing it."""
    try:
        if importlib.util.find_spec(module_name) is not None:
            return True
    except ImportError:
        pass

    # Try to install the module
    try:
        logger.info(f"Module {module_name} not found, attempting to install...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--no-cache-dir", module_name])
        return importlib.util.find_spec(module_name) is not None
    except Exception as e:
        logger.error(f"Failed to install {module_name}: {e}")
        return False

def _connect_with_psycopg2(db_url):
    """Connect using psycopg2."""
    import psycopg2
    return psycopg2.connect(db_url)

def _connect_with_pg8000(db_url):
    """Connect using pg8000 (pure Python PostgreSQL driver)."""
    import pg8000.native

    # Parse the connection string - simplified parsing
    if '://' in db_url:
        # Format: postgresql://username:password@host:port/database
        db_url = db_url.split('://', 1)[1]

    if '@' in db_url:
        auth, host_db = db_url.split('@', 1)
        user, password = auth.split(':', 1) if ':' in auth else (auth, '')

        if '/' in host_db:
            host_port, dbname = host_db.split('/', 1)
            if ':' in host_port:
                host, port = host_port.split(':', 1)
                port = int(port)
            else:
                host, port = host_port, 5432
        else:
            host, port = host_db, 5432
            dbname = ''

        return pg8000.native.connect(
            user=user,
            password=password,
            host=host,
            port=port,
            database=dbname
        )

    logger.error("Unable to parse connection string for pg8000")
    return None

def _connect_with_psycopg3(db_url):
    """Connect using psycopg3 (newer PostgreSQL driver)."""
    import psycopg
    return psycopg.connect(db_url)

def test_connection():
    """Test function to verify connection works."""
    conn = get_pg_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            logger.info(f"Test query result: {result}")
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error executing test query: {e}")
            return False
    return False

if __name__ == "__main__":
    # Set up logging for standalone testing
    logging.basicConfig(level=logging.INFO)
    result = test_connection()
    print(f"Connection test {'succeeded' if result else 'failed'}")
    sys.exit(0 if result else 1)
