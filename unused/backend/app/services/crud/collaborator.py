"""Collaborator CRUD service module."""
from typing import List, Optional
from app.models import UniverseCollaborator
from app.services.crud.base import CRUDBase


class CRUDCollaborator(CRUDBase):
    """CRUD operations for UniverseCollaborator model."""

    def __init__(self):
        super().__init__(UniverseCollaborator)

    def add_to_universe(
        self, universe_id: int, user_id: int, role: str = "viewer"
    ) -> Optional[UniverseCollaborator]:
        """Add a collaborator to a universe."""
        if self.model.query.filter_by(universe_id=universe_id, user_id=user_id).first():
            raise ValueError("User is already a collaborator")

        data = {"universe_id": universe_id, "user_id": user_id, "role": role}
        return self.create(data)

    def get_universe_collaborators(
        self, universe_id: int
    ) -> List[UniverseCollaborator]:
        """Get all collaborators for a universe."""
        return self.model.query.filter_by(universe_id=universe_id).all()

    def get_user_collaborations(self, user_id: int) -> List[UniverseCollaborator]:
        """Get all universes where user is a collaborator."""
        return self.model.query.filter_by(user_id=user_id).all()

    def update_role(
        self, universe_id: int, user_id: int, new_role: str
    ) -> Optional[UniverseCollaborator]:
        """Update collaborator's role."""
        collab = self.model.query.filter_by(
            universe_id=universe_id, user_id=user_id
        ).first()
        if not collab:
            return None
        return self.update(collab.id, {"role": new_role})

    def remove_from_universe(self, universe_id: int, user_id: int) -> bool:
        """Remove a collaborator from a universe."""
        collab = self.model.query.filter_by(
            universe_id=universe_id, user_id=user_id
        ).first()
        if not collab:
            return False
        return self.delete(collab.id)

    def check_role(self, universe_id: int, user_id: int, required_role: str) -> bool:
        """Check if user has required role for universe."""
        collab = self.model.query.filter_by(
            universe_id=universe_id, user_id=user_id
        ).first()
        if not collab:
            return False

        role_hierarchy = {"viewer": 0, "editor": 1, "admin": 2}
        return role_hierarchy.get(collab.role, -1) >= role_hierarchy.get(
            required_role, 0
        )


collaborator_crud = CRUDCollaborator()
