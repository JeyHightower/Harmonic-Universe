import pytest
from app import db
from app.models.user import User
from app.models.universe import Universe
from app.models.profile import Profile
from sqlalchemy.exc import IntegrityError
from datetime import datetime

class TestModels:
    """Test database models and their relationships"""

    def test_user_model(self, app):
        """Test User model operations and validations"""
        with app.app_context():
            # Test user creation
            user = User(
                username='testuser1',
                email='test1@example.com'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Test unique constraints
            duplicate_user = User(
                username='testuser1',
                email='another1@example.com'
            )
            duplicate_user.set_password('password123')
            db.session.add(duplicate_user)
            with pytest.raises(IntegrityError):
                db.session.commit()
            db.session.rollback()

            # Test password hashing
            assert user.check_password('password123')
            assert not user.check_password('wrongpassword')

            # Test relationships
            assert hasattr(user, 'profile')
            assert hasattr(user, 'owned_universes')
            assert hasattr(user, 'collaborating_universes')

            # Clean up
            db.session.delete(user)
            db.session.commit()

    def test_profile_model(self, app):
        """Test Profile model operations and relationships"""
        with app.app_context():
            # Create test user
            user = User(username='testuser2', email='test2@example.com')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Test profile creation
            profile = Profile(
                user_id=user.id,
                bio='Test bio',
                location='Test location',
                preferences={'theme': 'dark'}
            )
            db.session.add(profile)
            db.session.commit()

            # Test user-profile relationship
            assert user.profile == profile
            assert profile.user == user

            # Test profile update
            profile.bio = 'Updated bio'
            db.session.commit()
            assert user.profile.bio == 'Updated bio'

            # Clean up
            db.session.delete(user)  # Should cascade delete profile
            db.session.commit()

    def test_universe_model(self, app):
        """Test Universe model operations and relationships"""
        with app.app_context():
            # Create test user
            user = User(username='testuser3', email='test3@example.com')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Refresh user to ensure it's attached to session
            db.session.refresh(user)

            # Test universe creation
            universe = Universe(
                name='Test Universe',
                description='A test universe',
                creator_id=user.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            # Refresh universe to ensure it's attached to session
            db.session.refresh(universe)

            # Update parameters after creation
            universe.parameters = {
                'physics': {
                    'gravity': 9.81,
                    'time_dilation': 1.0
                }
            }
            db.session.commit()
            db.session.refresh(universe)

            # Test relationships
            assert universe in user.owned_universes
            assert universe.creator == user

            # Test adding collaborator
            collaborator = User(
                username='collaborator3',
                email='collab3@example.com'
            )
            collaborator.set_password('password123')
            db.session.add(collaborator)
            db.session.commit()

            # Refresh collaborator
            db.session.refresh(collaborator)

            # Add collaborator and refresh relationships
            universe.collaborators.append(collaborator)
            db.session.commit()
            db.session.refresh(universe)
            db.session.refresh(collaborator)

            assert universe in collaborator.collaborating_universes
            assert collaborator in universe.collaborators

            # Test universe update
            universe.update({
                'parameters': {
                    'physics': {
                        'gravity': 5.0,
                        'time_dilation': 1.0
                    }
                }
            })
            db.session.refresh(universe)
            assert universe.parameters['physics']['gravity'] == 5.0

            # Clean up - refresh objects before deletion
            db.session.refresh(universe)
            db.session.refresh(user)
            db.session.refresh(collaborator)

            db.session.delete(universe)
            db.session.delete(user)
            db.session.delete(collaborator)
            db.session.commit()

    def test_cascade_behavior(self, app):
        """Test cascade delete behavior"""
        with app.app_context():
            # Create test user
            user = User(username='testuser4', email='test4@example.com')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Create profile
            profile = Profile(
                user_id=user.id,
                bio='Test bio'
            )
            db.session.add(profile)

            # Create universe
            universe = Universe(
                name='Test Universe',
                description='A test universe',
                creator_id=user.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            # Store universe ID for later verification
            universe_id = universe.id

            # Delete user and verify cascades
            db.session.delete(user)
            db.session.commit()
            db.session.expire_all()  # Clear session to ensure fresh data

            # Verify profile is deleted
            assert Profile.query.filter_by(user_id=user.id).first() is None

            # Verify universe is not deleted but creator_id is set to None
            updated_universe = Universe.query.get(universe_id)
            assert updated_universe is not None
            assert updated_universe.creator_id is None

            # Clean up
            db.session.delete(updated_universe)
            db.session.commit()

    def test_model_timestamps(self, app):
        """Test automatic timestamp handling"""
        with app.app_context():
            # Create test user
            user = User(username='testuser5', email='test5@example.com')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            # Create universe
            universe = Universe(
                name='Test Universe',
                description='A test universe',
                creator_id=user.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            assert isinstance(universe.created_at, datetime)
            assert isinstance(universe.updated_at, datetime)
            original_updated_at = universe.updated_at

            # Wait a moment to ensure timestamp difference
            import time
            time.sleep(1)

            # Update universe
            universe.description = 'Updated description'
            db.session.commit()

            assert universe.updated_at > original_updated_at

            # Clean up
            db.session.delete(universe)
            db.session.delete(user)
            db.session.commit()
