"""Demo user creation."""
from app.db.session import get_db
from app.models.core.user import User

def create_demo_user():
    """Create demo user if it doesn't exist."""
    with get_db() as db:
        if db.query(User).filter_by(email='demo@example.com').first():
            return

        demo_user = User(
            username='Demo',
            email='demo@example.com',
            password='password',  # This will be hashed in the User model
            is_active=True,
            color='#FF0000'
        )
        demo_user.save(db)
