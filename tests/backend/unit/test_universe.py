import pytest
from app.models.universe import Universe
from app.models.user import User
from app import db

class TestUniverseModel:
    def test_create_universe(self, app, test_user):
        """Test universe creation"""
        with app.app_context():
            universe = Universe(
                name="Test Universe",
                description="A test universe",
                creator_id=test_user.id,
                is_public=True,
                physics_parameters={
                    'gravity': 9.81,
                    'time_dilation': 1.0
                }
            )
            db.session.add(universe)
            db.session.commit()

            assert universe.id is not None
            assert universe.name == "Test Universe"
            assert universe.creator_id == test_user.id
            assert universe.physics_parameters['gravity'] == 9.81

    def test_universe_relationships(self, app, test_user):
        """Test universe relationships with users"""
        with app.app_context():
            # Create universe
            universe = Universe(
                name="Relationship Test",
                description="Testing relationships",
                creator_id=test_user.id,
                is_public=True
            )
            db.session.add(universe)
            db.session.commit()

            # Test creator relationship
            assert universe.creator == test_user
            assert universe in test_user.created_universes

            # Test collaborator relationship
            collaborator = User(
                username="collaborator",
                email="collab@example.com"
            )
            collaborator.set_password("password123")
            db.session.add(collaborator)
            db.session.commit()

            universe.collaborators.append(collaborator)
            db.session.commit()

            assert collaborator in universe.collaborators
            assert universe in collaborator.collaborative_universes

    def test_universe_validation(self, app, test_user):
        """Test universe model validation"""
        with app.app_context():
            # Test required fields
            invalid_universe = Universe()
            with pytest.raises(Exception):
                db.session.add(invalid_universe)
                db.session.commit()
            db.session.rollback()

            # Test name length validation
            long_name_universe = Universe(
                name="a" * 256,  # Exceeds max length
                description="Test",
                creator_id=test_user.id
            )
            with pytest.raises(Exception):
                db.session.add(long_name_universe)
                db.session.commit()
            db.session.rollback()

    def test_physics_parameters(self, app, test_user):
        """Test physics parameters handling"""
        with app.app_context():
            universe = Universe(
                name="Physics Test",
                description="Testing physics",
                creator_id=test_user.id,
                physics_parameters={
                    'gravity': 9.81,
                    'time_dilation': 1.0,
                    'custom_param': 'value'
                }
            )
            db.session.add(universe)
            db.session.commit()

            # Test parameter access
            assert universe.physics_parameters['gravity'] == 9.81
            assert 'custom_param' in universe.physics_parameters

            # Test parameter update
            universe.physics_parameters['gravity'] = 5.0
            db.session.commit()

            updated_universe = Universe.query.get(universe.id)
            assert updated_universe.physics_parameters['gravity'] == 5.0

    def test_universe_deletion(self, app, test_user):
        """Test universe deletion and cascading"""
        with app.app_context():
            universe = Universe(
                name="Delete Test",
                description="Testing deletion",
                creator_id=test_user.id
            )
            db.session.add(universe)
            db.session.commit()

            universe_id = universe.id
            db.session.delete(universe)
            db.session.commit()

            # Verify universe is deleted
            assert Universe.query.get(universe_id) is None

            # Verify user still exists
            assert User.query.get(test_user.id) is not None
