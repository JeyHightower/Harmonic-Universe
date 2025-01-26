"""CRUD operations package."""
from .base import CRUDBase
from .user import CRUDUser
from .universe import CRUDUniverse
from .collaborator import CRUDCollaborator
from .comment import CRUDComment
from .physics import CRUDPhysics

# Initialize CRUD instances
user = CRUDUser()
universe = CRUDUniverse()
collaborator = CRUDCollaborator()
comment = CRUDComment()
physics = CRUDPhysics()

__all__ = ["CRUDBase", "user", "universe", "collaborator", "comment", "physics"]
