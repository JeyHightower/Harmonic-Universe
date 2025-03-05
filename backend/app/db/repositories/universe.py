"""
Repository for Universe-related database operations.
"""
from typing import List, Optional
from uuid import UUID
from backend.app.models.universe.universe import Universe
from backend.app.core.errors import NotFoundError

class UniverseRepository:
    """Repository for Universe-related database operations."""

    def __init__(self, session):
        """Initialize with database session."""
        self.session = session

    def get_universes_by_user_id(self, user_id: UUID) -> List[Universe]:
        """Get all universes owned by a specific user."""
        return self.session.query(Universe).filter_by(user_id=user_id).all()

    def get_universe_by_id(self, universe_id: str) -> Optional[Universe]:
        """Get a universe by its ID."""
        try:
            # Convert string ID to UUID if needed
            if isinstance(universe_id, str):
                universe_id = UUID(universe_id)

            universe = self.session.query(Universe).filter_by(id=universe_id).first()
            return universe
        except Exception as e:
            # Log the error and return None
            import logging
            logging.error(f"Error getting universe by ID: {e}")
            return None

    def create_universe(self, universe_data: dict, user_id: UUID) -> Universe:
        """Create a new universe."""
        universe = Universe(
            name=universe_data.get('name'),
            description=universe_data.get('description', ''),
            is_public=universe_data.get('is_public', False),
            user_id=user_id,
            physics_params=universe_data.get('physics_params'),
            harmony_params=universe_data.get('harmony_params'),
            visualization_params=universe_data.get('visualization_params'),
            ai_params=universe_data.get('ai_params')
        )
        self.session.add(universe)
        self.session.commit()
        return universe

    def update_universe(self, universe_id: UUID, universe_data: dict) -> Universe:
        """Update an existing universe."""
        universe = self.get_universe_by_id(universe_id)
        if not universe:
            raise NotFoundError(f"Universe with ID {universe_id} not found")

        for key, value in universe_data.items():
            if hasattr(universe, key):
                setattr(universe, key, value)

        self.session.commit()
        return universe

    def delete_universe(self, universe_id: str) -> bool:
        """Delete a universe by its ID."""
        try:
            # Convert string ID to UUID if needed
            if isinstance(universe_id, str):
                universe_id = UUID(universe_id)

            # Get the universe using the get_universe_by_id method instead of get_by_id
            universe = self.get_universe_by_id(universe_id)
            if not universe:
                return False

            self.session.delete(universe)
            self.session.commit()
            return True
        except Exception as e:
            # Log the error and return False
            import logging
            logging.error(f"Error deleting universe: {e}")
            return False
