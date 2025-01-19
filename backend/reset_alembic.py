from app import create_app
from app.extensions import db

def reset_alembic():
    app = create_app()
    with app.app_context():
        # Drop the alembic_version table if it exists
        db.engine.execute('DROP TABLE IF EXISTS alembic_version')
        print("Alembic version table reset successfully!")

if __name__ == '__main__':
    reset_alembic()
