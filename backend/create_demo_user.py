from app import create_app
from app.models.core.user import User
from app.db.session import get_db
from sqlalchemy.exc import IntegrityError

def create_demo_user():
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
        except IntegrityError:
            print("Demo user already exists")
        except Exception as e:
            print(f"Error creating demo user: {str(e)}")

if __name__ == "__main__":
    create_demo_user()
