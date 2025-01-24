from app.models.universe import Universe
from app.models.user import User
from app import db

class UniverseService:
    def create_universe(self, user_id, data):
        """Create a new universe."""
        user = User.query.get(user_id)
        if not user:
            raise ValueError('User not found')

        universe = Universe(
            name=data['name'],
            description=data.get('description', ''),
            creator_id=user_id,
            is_public=data.get('is_public', False),
            allow_guests=data.get('allow_guests', False)
        )

        try:
            db.session.add(universe)
            db.session.commit()
            return universe
        except Exception as e:
            db.session.rollback()
            raise Exception('Failed to create universe') from e

    def get_universe(self, universe_id):
        """Get a universe by ID."""
        return Universe.query.get(universe_id)

    def update_universe(self, universe_id, user_id, data):
        """Update a universe."""
        universe = Universe.query.get(universe_id)
        if not universe:
            return None

        if universe.creator_id != user_id:
            raise ValueError('Unauthorized to update this universe')

        try:
            for key, value in data.items():
                if hasattr(universe, key):
                    setattr(universe, key, value)

            db.session.commit()
            return universe
        except Exception as e:
            db.session.rollback()
            raise Exception('Failed to update universe') from e

    def delete_universe(self, universe_id, user_id):
        """Delete a universe."""
        universe = Universe.query.get(universe_id)
        if not universe:
            return

        if universe.creator_id != user_id:
            raise ValueError('Unauthorized to delete this universe')

        try:
            db.session.delete(universe)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception('Failed to delete universe') from e

    def get_user_universes(self, user_id):
        """Get all universes created by a user."""
        return Universe.query.filter_by(creator_id=user_id).all()

    def get_public_universes(self):
        """Get all public universes."""
        return Universe.query.filter_by(is_public=True).all()

    def search_universes(self, query):
        """Search universes by name or description."""
        return Universe.query.filter(
            (Universe.name.ilike(f'%{query}%')) |
            (Universe.description.ilike(f'%{query}%'))
        ).all()
