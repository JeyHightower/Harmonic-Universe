from typing import Dict, List, Optional
from app.models import Universe, UniverseCollaborator
from app.services.base import BaseService
from sqlalchemy import or_


class UniverseService(BaseService):
    """Service class for Universe model operations."""

    def __init__(self):
        super().__init__(Universe)

    def create_universe(self, user_id: int, data: Dict) -> Optional[Universe]:
        """Create a new universe."""
        data["user_id"] = user_id
        return self.create(data)

    def get_user_universes(self, user_id: int) -> List[Universe]:
        """Get all universes owned by a user."""
        return self.get_by_filter(user_id=user_id)

    def get_accessible_universes(self, user_id: int) -> List[Universe]:
        """Get all universes accessible to a user (owned + collaborated)."""
        return Universe.query.filter(
            or_(
                Universe.user_id == user_id,
                Universe.id.in_(
                    UniverseCollaborator.query.filter_by(user_id=user_id).with_entities(
                        UniverseCollaborator.universe_id
                    )
                ),
            )
        ).all()

    def get_public_universes(self) -> List[Universe]:
        """Get all public universes."""
        return self.get_by_filter(is_public=True)

    def update_universe(
        self, universe_id: int, user_id: int, data: Dict
    ) -> Optional[Universe]:
        """Update a universe if user has permission."""
        universe = self.get_by_id(universe_id)
        if not universe or universe.user_id != user_id:
            return None
        return self.update(universe_id, data)

    def delete_universe(self, universe_id: int, user_id: int) -> bool:
        """Delete a universe if user has permission."""
        universe = self.get_by_id(universe_id)
        if not universe or universe.user_id != user_id:
            return False
        return self.delete(universe_id)

    def check_access(self, universe_id: int, user_id: int) -> bool:
        """Check if user has access to universe."""
        universe = self.get_by_id(universe_id)
        if not universe:
            return False

        # Owner has access
        if universe.user_id == user_id:
            return True

        # Public universe
        if universe.is_public:
            return True

        # Check collaborator access
        collaborator = UniverseCollaborator.query.filter_by(
            universe_id=universe_id, user_id=user_id
        ).first()

        return collaborator is not None

    def search_universes(
        self, query: str, user_id: Optional[int] = None
    ) -> List[Universe]:
        """Search universes by name or description."""
        base_query = Universe.query.filter(
            or_(
                Universe.name.ilike(f"%{query}%"),
                Universe.description.ilike(f"%{query}%"),
            )
        )

        if user_id:
            base_query = base_query.filter(
                or_(
                    Universe.user_id == user_id,
                    Universe.is_public == True,
                    Universe.id.in_(
                        UniverseCollaborator.query.filter_by(
                            user_id=user_id
                        ).with_entities(UniverseCollaborator.universe_id)
                    ),
                )
            )
        else:
            base_query = base_query.filter(Universe.is_public == True)

        return base_query.all()
