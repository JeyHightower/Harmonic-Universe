from backend.app.db.session import get_db
from backend.app.models.user import User

def create_demo_user():
    with get_db() as db:
        # Delete existing demo user if exists
        demo_user = db.query(User).filter_by(email='demo@example.com').first()
        if demo_user:
            print("Deleting existing demo user...")
            db.delete(demo_user)
            db.commit()
            print("Deleted demo user")

        # Create new demo user
        demo_user = User(
            email='demo@example.com',
            username='demo',
            is_active=True
        )
        demo_user.set_password('demo123')
        db.add(demo_user)
        db.commit()
        print("Created demo user")

        # Verify password works
        if demo_user.check_password('demo123'):
            print("Password verification successful")
        else:
            print("Password verification failed!")
        return demo_user

if __name__ == '__main__':
    create_demo_user()
