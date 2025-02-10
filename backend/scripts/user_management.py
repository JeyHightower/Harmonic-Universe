from app import create_app
from app.models.core.user import User
from app.db.session import get_db
from sqlalchemy.exc import IntegrityError

def create_demo_user():
    """Create a demo user if it doesn't exist."""
    app = create_app()

    with app.app_context():
        try:
            user = User(
                username='demo',
                email='demo@example.com',
                password='demo123'
            )

            with get_db() as db:
                db.add(user)
                db.commit()
                print(f"Created demo user: {user.username} ({user.email})")
                return True
        except IntegrityError:
            print("Demo user already exists")
            return False
        except Exception as e:
            print(f"Error creating demo user: {str(e)}")
            return False

def verify_demo_user():
    """Verify if demo user exists and print their details."""
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
                    return True
                else:
                    print("Demo user not found")
                    return False
        except Exception as e:
            print(f"Error verifying demo user: {str(e)}")
            return False

def manage_demo_user(action='verify'):
    """Main function to manage demo user operations."""
    if action == 'create':
        return create_demo_user()
    elif action == 'verify':
        return verify_demo_user()
    else:
        print(f"Unknown action: {action}")
        return False

if __name__ == "__main__":
    import sys
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    manage_demo_user(action)
