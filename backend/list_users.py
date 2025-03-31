from app import create_app
from app.api.models.user import User

def list_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print("Users in database:")
        if users:
            for user in users:
                print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
        else:
            print("No users found in the database.")

if __name__ == '__main__':
    list_users() 