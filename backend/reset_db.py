import os
import shutil
from app import create_app

def reset_db():
    app = create_app()

    # Get the database directory
    db_dir = os.path.dirname(os.path.abspath(__file__))

    # List of files/directories to remove
    to_remove = [
        'migrations',
        '*.db',
        '__pycache__',
        '.pytest_cache'
    ]

    # Remove files and directories
    for item in to_remove:
        if '*' in item:
            # Handle wildcards
            import glob
            for f in glob.glob(os.path.join(db_dir, item)):
                try:
                    os.remove(f)
                    print(f"Removed file: {f}")
                except:
                    pass
        else:
            path = os.path.join(db_dir, item)
            if os.path.exists(path):
                if os.path.isdir(path):
                    shutil.rmtree(path)
                else:
                    os.remove(path)
                print(f"Removed: {path}")

    print("Database reset complete!")
    print("Now run:")
    print("1. flask db init")
    print("2. flask db migrate -m 'Initial migration'")
    print("3. flask db upgrade")

if __name__ == '__main__':
    reset_db()
