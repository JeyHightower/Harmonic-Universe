import os
import sys
import sqlite3
from pathlib import Path

# Add the parent directory to the Python path so we can import from app
backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from app.config import get_database_uri

def test_sqlite():
    """Test SQLite functionality."""
    # Test in-memory database
    conn = sqlite3.connect(':memory:')
    c = conn.cursor()
    c.execute('''CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)''')
    c.execute("INSERT INTO test VALUES (1, 'test_user')")
    c.execute('SELECT * FROM test')
    result = c.fetchone()
    conn.close()
    print(f"In-memory SQLite test result: {result}")

    # Test file-based database
    instance_dir = os.path.join(backend_dir, 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    os.chmod(instance_dir, 0o777)

    db_path = os.path.join(instance_dir, 'dev.db')
    db_uri = get_database_uri(instance_dir, 'dev.db')

    print(f"\nDatabase configuration:")
    print(f"Backend directory: {backend_dir}")
    print(f"Instance directory: {instance_dir}")
    print(f"Database path: {db_path}")
    print(f"Database URI: {db_uri}")

    # Test file-based database
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Drop test table if it exists
    c.execute("DROP TABLE IF EXISTS test")

    # Create and populate test table
    c.execute('''CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)''')
    c.execute("INSERT INTO test VALUES (1, 'test_user')")
    c.execute('SELECT * FROM test')
    result = c.fetchone()
    conn.commit()
    conn.close()

    # Check file permissions and existence
    if os.path.exists(db_path):
        print(f"\nDatabase file created successfully:")
        print(f"Path: {db_path}")
        print(f"Permissions: {oct(os.stat(db_path).st_mode)[-3:]}")
        print(f"Size: {os.path.getsize(db_path)} bytes")
        print(f"File-based SQLite test result: {result}")
    else:
        print("Error: Database file was not created")
        sys.exit(1)

def setup_database():
    """Set up the database."""
    # Test SQLite functionality first
    test_sqlite()

    # Create Flask app with database configuration
    app = create_app()

    # Verify the database URI matches our expected URI
    instance_dir = os.path.join(backend_dir, 'instance')
    expected_uri = get_database_uri(instance_dir, 'dev.db')
    actual_uri = app.config['SQLALCHEMY_DATABASE_URI']

    print(f"\nVerifying database configuration:")
    print(f"Expected URI: {expected_uri}")
    print(f"Actual URI: {actual_uri}")

    if expected_uri != actual_uri:
        print("Warning: Database URIs do not match!")
        print("This might cause issues with database connectivity.")

    # Get database instance
    from app.extensions import db

    try:
        # Create all database tables
        with app.app_context():
            db.create_all()
            print("\nDatabase tables created successfully!")
    except Exception as e:
        print(f"\nError creating database tables: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    # Change to the backend directory
    os.chdir(backend_dir)
    print(f"Working directory: {os.getcwd()}")

    # Set up the database
    setup_database()

