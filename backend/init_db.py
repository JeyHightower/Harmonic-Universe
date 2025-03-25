import os
from app import create_app, db

def init_db():
    app = create_app()
    
    # Ensure instance directory exists
    instance_path = os.path.join(os.path.dirname(__file__), 'instance')
    os.makedirs(instance_path, exist_ok=True)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print('Database initialized successfully!')

if __name__ == '__main__':
    init_db() 