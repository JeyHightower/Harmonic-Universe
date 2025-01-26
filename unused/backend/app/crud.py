"""CRUD operations module."""
from typing import Dict, List, Optional, Type, TypeVar
from app.extensions import db
from app.models import User, Universe, UniverseCollaborator, Comment, PhysicsParameters
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

T = TypeVar("T")


class CRUDBase:
    """Base class for CRUD operations."""

    def __init__(self, model: Type[T]):
        self.model = model

    def create(self, data: Dict) -> Optional[T]:
        try:
            obj = self.model(**data)
            db.session.add(obj)
            db.session.commit()
            return obj
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def get(self, id: int) -> Optional[T]:
        return self.model.query.get(id)

    def get_multi(self) -> List[T]:
        return self.model.query.all()

    def update(self, id: int, data: Dict) -> Optional[T]:
        try:
            obj = self.get(id)
            if obj:
                for key, value in data.items():
                    setattr(obj, key, value)
                db.session.commit()
            return obj
        except SQLAlchemyError:
            db.session.rollback()
            raise

    def delete(self, id: int) -> bool:
        try:
            obj = self.get(id)
            if obj:
                db.session.delete(obj)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError:
            db.session.rollback()
            raise


class CRUDUser(CRUDBase):
    """CRUD operations for User model."""

    def __init__(self):
        super().__init__(User)

    def create_with_password(self, data: Dict) -> Optional[User]:
        password = data.pop("password", None)
        if not password:
            raise ValueError("Password is required")
        user = self.create(data)
        if user:
            user.set_password(password)
        return user

    def authenticate(self, email: str, password: str) -> Optional[User]:
        user = self.model.query.filter_by(email=email).first()
        if user and user.check_password(password):
            return user
        return None


class CRUDUniverse(CRUDBase):
    """CRUD operations for Universe model."""

    def __init__(self):
        super().__init__(Universe)

    def create_for_user(self, user_id: int, data: Dict) -> Optional[Universe]:
        data["user_id"] = user_id
        return self.create(data)

    def get_by_user(self, user_id: int) -> List[Universe]:
        return self.model.query.filter_by(user_id=user_id).all()

    def get_accessible(self, user_id: int) -> List[Universe]:
        return self.model.query.filter(
            or_(Universe.user_id == user_id, Universe.is_public == True)
        ).all()


class CRUDCollaborator(CRUDBase):
    """CRUD operations for UniverseCollaborator model."""

    def __init__(self):
        super().__init__(UniverseCollaborator)

    def add_to_universe(
        self, universe_id: int, user_id: int, role: str = "viewer"
    ) -> Optional[UniverseCollaborator]:
        data = {"universe_id": universe_id, "user_id": user_id, "role": role}
        return self.create(data)

    def get_universe_collaborators(
        self, universe_id: int
    ) -> List[UniverseCollaborator]:
        return self.model.query.filter_by(universe_id=universe_id).all()


class CRUDComment(CRUDBase):
    """CRUD operations for Comment model."""

    def __init__(self):
        super().__init__(Comment)

    def create_comment(
        self, universe_id: int, user_id: int, content: str
    ) -> Optional[Comment]:
        data = {"universe_id": universe_id, "user_id": user_id, "content": content}
        return self.create(data)

    def get_universe_comments(self, universe_id: int) -> List[Comment]:
        return self.model.query.filter_by(universe_id=universe_id).all()


class CRUDPhysics(CRUDBase):
    """CRUD operations for PhysicsParameters model."""

    def __init__(self):
        super().__init__(PhysicsParameters)

    def create_for_universe(
        self, universe_id: int, data: Dict
    ) -> Optional[PhysicsParameters]:
        data["universe_id"] = universe_id
        return self.create(data)

    def get_universe_parameters(self, universe_id: int) -> Optional[PhysicsParameters]:
        return self.model.query.filter_by(universe_id=universe_id).first()


# Initialize CRUD instances
user = CRUDUser()
universe = CRUDUniverse()
collaborator = CRUDCollaborator()
comment = CRUDComment()
physics = CRUDPhysics()
