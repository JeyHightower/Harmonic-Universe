from app.api.models.user import User
from app import create_app

app = create_app()

with app.app_context():
    users = User.query.all()
    print("Users in database:")
    if users:
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
    else:
        print("No users found in the database.") 