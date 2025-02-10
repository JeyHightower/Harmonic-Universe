from app import create_app
from app.models.core.user import User
from app.db.session import get_db

def verify_demo_user():
    app = create_app()

    with app.app_context():
        try:
            with get_db() as db:
                user = db.query(User).filter(User.email == 'demo@example.com').first()
                if user:
                    print(f"Found demo user:")
                    print(f"  Username: {user.username}")
                    print(f"  Email: {user.email}")
                    print(f"  Active: {user.is_active}")
                    print(f"  Created at: {user.created_at}")
                else:
                    print("Demo user not found")
        except Exception as e:
            print(f"Error verifying demo user: {str(e)}")

if __name__ == "__main__":
    verify_demo_user()
