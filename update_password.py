from app import create_app
from app.api.models.user import User
from app.extensions import db

def update_user_password():
    app = create_app()
    with app.app_context():
        # Find the user
        user = User.query.filter_by(email='user@example.io').first()
        if not user:
            print("User not found")
            return
        
        # Update password
        user.set_password('password123')
        db.session.commit()
        
        print(f"Password updated for user: {user.username} ({user.email})")
        
        # Verify all users
        users = User.query.all()
        print("\nAll users:")
        for u in users:
            print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")

if __name__ == '__main__':
    update_user_password() 