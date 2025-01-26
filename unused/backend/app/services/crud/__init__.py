"""CRUD services initialization."""
from .base import CRUDBase
from .user import CRUDUser, user_crud
from .universe import CRUDUniverse, universe_crud
from .collaborator import CRUDCollaborator, collaborator_crud
from .comment import CRUDComment, comment_crud
from .physics import CRUDPhysics, physics_crud

__all__ = [
    "CRUDBase",
    "CRUDUser",
    "CRUDUniverse",
    "CRUDCollaborator",
    "CRUDComment",
    "CRUDPhysics",
    "user_crud",
    "universe_crud",
    "collaborator_crud",
    "comment_crud",
    "physics_crud",
]
