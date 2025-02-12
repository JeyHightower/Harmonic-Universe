from app import create_app
from app.seeds.demo_user import create_demo_user, verify_demo_user

app = create_app()

with app.app_context():
    create_demo_user()
    print('Demo user verification:', verify_demo_user())
