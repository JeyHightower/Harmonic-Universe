import sys
from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe
from app.api.models.scene import Scene
from app.api.models.character import Character
from app.api.models.note import Note
from app.api.models.audio import Music, SoundProfile
from app.api.models.physics import PhysicsObject
from sqlalchemy import text

app = create_app()
app.app_context().push()

# Use raw SQL to get demo user IDs except demo@example.com
user_ids = [row[0] for row in db.session.execute(text("""
    SELECT id FROM users WHERE email LIKE 'demo%@example.com' AND email != 'demo@example.com' AND is_deleted = false
""")).fetchall()]
old_demo_users = User.query.filter(User.id.in_(user_ids)).all()
print(f"Found {len(old_demo_users)} old demo users.")
for user in old_demo_users:
    print(f"Deleting user {user.email} (ID: {user.id}) and their universes...")
    universes = Universe.query.filter_by(user_id=user.id).all()
    for universe in universes:
        Scene.query.filter_by(universe_id=universe.id).delete()
        Character.query.filter_by(universe_id=universe.id).delete()
        Note.query.filter_by(universe_id=universe.id).delete()
        Music.query.filter_by(universe_id=universe.id).delete()
        PhysicsObject.query.filter_by(universe_id=universe.id).delete()
        SoundProfile.query.filter_by(universe_id=universe.id).delete()
        db.session.delete(universe)
        db.session.commit()
    db.session.delete(user)
    db.session.commit()
print("Cleanup complete.")
