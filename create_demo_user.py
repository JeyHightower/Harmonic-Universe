from app.db.session import get_db
from app.models.user import User
from werkzeug.security import generate_password_hash

with get_db() as db:
    demo_user = db.query(User).filter_by(email='demo@example.com').first()
    print(f'Demo user exists: {demo_user is not None}')
    if not demo_user:
        new_user = User(
            email='demo@example.com',
            username='demo',
            password=generate_password_hash('demo123'),
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print('Demo user created!')
