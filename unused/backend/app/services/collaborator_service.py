from typing import List, Optional
from app.models import UniverseCollaborator
from app.services.base import BaseService


class CollaboratorService(BaseService):
    """Service class for UniverseCollaborator model operations."""

    def __init__(self):
        super().__init__(UniverseCollaborator)

    def add_collaborator(
        self, universe_id: int, user_id: int, role: str = "viewer"
    ) -> Optional[UniverseCollaborator]:
        """Add a collaborator to a universe."""
        if self.exists(universe_id=universe_id, user_id=user_id):
            raise ValueError("User is already a collaborator")

        data = {"universe_id": universe_id, "user_id": user_id, "role": role}
        return self.create(data)

    def get_universe_collaborators(
        self, universe_id: int
    ) -> List[UniverseCollaborator]:
        """Get all collaborators for a universe."""
        return self.get_by_filter(universe_id=universe_id)

    def get_user_collaborations(self, user_id: int) -> List[UniverseCollaborator]:
        """Get all universes where user is a collaborator."""
        return self.get_by_filter(user_id=user_id)

    def update_role(
        self, universe_id: int, user_id: int, new_role: str
    ) -> Optional[UniverseCollaborator]:
        """Update collaborator's role."""
        collaborator = self.get_one_by_filter(universe_id=universe_id, user_id=user_id)
        if collaborator:
            return self.update(collaborator.id, {"role": new_role})
        return None

    def remove_collaborator(self, universe_id: int, user_id: int) -> bool:
        """Remove a collaborator from a universe."""
        collaborator = self.get_one_by_filter(universe_id=universe_id, user_id=user_id)
        if collaborator:
            return self.delete(collaborator.id)
        return False

    def check_role(self, universe_id: int, user_id: int, required_role: str) -> bool:
        """Check if user has required role for universe."""
        collaborator = self.get_one_by_filter(universe_id=universe_id, user_id=user_id)
        if not collaborator:
            return False

        role_hierarchy = {"viewer": 0, "editor": 1, "admin": 2}

        return role_hierarchy.get(collaborator.role, -1) >= role_hierarchy.get(
            required_role, 0
        )
