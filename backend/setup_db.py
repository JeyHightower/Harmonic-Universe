import os
import sys
from flask_migrate import Migrate, init, migrate, upgrade
from app import create_app, db

def setup_database():
    # Create Flask application
    app = create_app()
    
    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        
    # Remove existing database file if it exists
    db_path = os.path.join(instance_path, 'app.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        
    # Create empty database file with proper permissions
    with open(db_path, 'w') as f:
        pass
    os.chmod(db_path, 0o666)
    
    with app.app_context():
        # Initialize migrations if they don't exist
        if not os.path.exists('migrations'):
            init()
        
        # Create a migration
        migrate(message='initial migration')
        
        # Apply migration
        upgrade()
        
        print("Database setup completed successfully!")

if __name__ == '__main__':
    setup_database() 