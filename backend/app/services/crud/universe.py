"""Universe CRUD service module."""
from typing import Dict, List, Optional
from app.models import Universe
from app.services.crud.base import CRUDBase
from sqlalchemy import or_


class CRUDUniverse(CRUDBase):
    """CRUD operations for Universe model."""

    def __init__(self):
        super().__init__(Universe)

    def create_for_user(self, user_id: int, data: Dict) -> Optional[Universe]:
        """Create a new universe for a user."""
        data["user_id"] = user_id
        return self.create(data)

    def get_by_user(self, user_id: int) -> List[Universe]:
        """Get all universes owned by a user."""
        return self.model.query.filter_by(user_id=user_id).all()

    def get_public(self) -> List[Universe]:
        """Get all public universes."""
        return self.model.query.filter_by(is_public=True).all()

    def get_accessible(self, user_id: int) -> List[Universe]:
        """Get all universes accessible to a user."""
        return self.model.query.filter(
            or_(Universe.user_id == user_id, Universe.is_public == True)
        ).all()

    def update_if_owner(
        self, universe_id: int, user_id: int, data: Dict
    ) -> Optional[Universe]:
        """Update a universe if user is the owner."""
        universe = self.get(universe_id)
        if not universe or universe.user_id != user_id:
            return None
        return self.update(universe_id, data)

    def delete_if_owner(self, universe_id: int, user_id: int) -> bool:
        """Delete a universe if user is the owner."""
        universe = self.get(universe_id)
        if not universe or universe.user_id != user_id:
            return False
        return self.delete(universe_id)

    def search(self, query: str) -> List[Universe]:
        """Search universes by name or description."""
        return self.model.query.filter(
            or_(
                Universe.name.ilike(f"%{query}%"),
                Universe.description.ilike(f"%{query}%"),
            )
        ).all()


universe_crud = CRUDUniverse()
