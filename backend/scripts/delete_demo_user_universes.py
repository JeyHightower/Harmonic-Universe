import sys
from app import create_app
from app.extensions import db
from app.api.models.user import User
from app.api.models.universe import Universe
from app.api.models.scene import Scene
from app.api.models.note import Note
from app.api.models.character import Character
from app.api.models.audio import AudioSample, MusicPiece, Music
from app.api.models.physics import PhysicsObject, Physics2D, Physics3D
from app.api.models.audio import SoundProfile
# Add other models as needed

def delete_demo_user_universes():
    app = create_app()
    with app.app_context():
        demo_user = User.query.filter_by(email='demo@example.com').first()
        if not demo_user:
            print('No demo user found.')
            return
        universes = Universe.query.filter_by(user_id=demo_user.id, is_deleted=False).all()
        print(f'Found {len(universes)} universes for demo user.')
        for universe in universes:
            print(f'Deleting related records for universe: {universe.name} (ID: {universe.id})')
            # Delete related scenes
            Scene.query.filter_by(universe_id=universe.id).delete()
            # Delete related notes
            Note.query.filter_by(universe_id=universe.id).delete()
            # Delete related characters
            Character.query.filter_by(universe_id=universe.id).delete()
            # Delete related audio samples
            AudioSample.query.filter_by(universe_id=universe.id).delete()
            # Delete related music pieces
            MusicPiece.query.filter_by(universe_id=universe.id).delete()
            # Delete related music
            Music.query.filter_by(universe_id=universe.id).delete()
            # Delete related physics objects
            PhysicsObject.query.filter_by(universe_id=universe.id).delete()
            # Delete related physics 2D
            Physics2D.query.filter_by(universe_id=universe.id).delete()
            # Delete related physics 3D
            Physics3D.query.filter_by(universe_id=universe.id).delete()
            # Delete related sound profiles
            SoundProfile.query.filter_by(universe_id=universe.id).delete()
            # TODO: Add other related models as needed
            db.session.delete(universe)
        db.session.commit()
        print('All demo user universes and related records deleted.')

if __name__ == '__main__':
    delete_demo_user_universes()
