import os
import sys
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def setup_database():
    # Load environment variables
    load_dotenv()
    
    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        os.chmod(instance_path, 0o777)
        
    # Remove existing database file if it exists
    db_path = os.path.join(instance_path, 'app.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        
    # Create empty database file with proper permissions
    with open(db_path, 'w') as f:
        pass
    os.chmod(db_path, 0o666)
    
    # Set SQLite database URL explicitly
    os.environ['DATABASE_URL'] = f'sqlite:///{db_path}'
    
    # Import after setting DATABASE_URL
    from flask_migrate import Migrate, init, migrate as create_migration, upgrade
    from app import create_app, db
    from app.api.models import User, Universe, Scene, Character, Note, Physics2D, Physics3D, PhysicsObject, PhysicsConstraint
    
    # Create Flask application
    app = create_app()
    
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)
    
    with app.app_context():
        # Remove existing migrations directory if it exists
        migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
        if os.path.exists(migrations_dir):
            import shutil
            shutil.rmtree(migrations_dir)
        
        # Initialize migrations
        init()
        
        # Create a new migration
        create_migration(message='initial migration')
        
        # Apply the migration
        upgrade()
        
        print("Database setup completed successfully!")

if __name__ == '__main__':
    setup_database() 