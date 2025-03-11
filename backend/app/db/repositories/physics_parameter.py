"""
Repository for PhysicsParameters-related database operations.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from backend.app.models.physics.parameters import PhysicsParameters
from backend.app.core.errors import NotFoundError


class PhysicsParameterRepository:
    """Repository for PhysicsParameters-related database operations."""

    def __init__(self, session):
        """Initialize with database session."""
        self.session = session

    def get_by_scene(self, scene_id: str) -> List[PhysicsParameters]:
        """Get physics parameters for a scene."""
        try:
            if isinstance(scene_id, str):
                scene_id = UUID(scene_id)
            return (
                self.session.query(PhysicsParameters).filter_by(scene_id=scene_id).all()
            )
        except ValueError:
            return []

    def get(self, id: str) -> Optional[PhysicsParameters]:
        """Get a physics parameter by ID."""
        try:
            if isinstance(id, str):
                id = UUID(id)
            return self.session.query(PhysicsParameters).filter_by(id=id).first()
        except ValueError:
            import logging

            logging.error(f"Invalid physics parameter ID format: {id}")
            return None

    def create_with_scene(self, obj_in: dict) -> PhysicsParameters:
        """Create new physics parameters for a scene."""
        if isinstance(obj_in.get("scene_id"), str):
            obj_in["scene_id"] = UUID(obj_in["scene_id"])
        db_obj = PhysicsParameters(**obj_in)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: PhysicsParameters, obj_in: dict) -> PhysicsParameters:
        """Update physics parameters."""
        try:
            # Update fields
            for field, value in obj_in.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)

            self.session.commit()
            self.session.refresh(db_obj)
            return db_obj
        except Exception as e:
            self.session.rollback()
            import logging

            logging.error(f"Error updating physics parameter: {e}")
            raise

    def remove(self, id: str) -> bool:
        """Remove physics parameters."""
        try:
            if isinstance(id, str):
                id = UUID(id)
            obj = self.get(id)
            if not obj:
                raise NotFoundError(f"Physics parameter {id} not found")

            self.session.delete(obj)
            self.session.commit()
            return True
        except ValueError:
            raise NotFoundError(f"Invalid physics parameter ID format: {id}")
        except Exception as e:
            self.session.rollback()
            import logging

            logging.error(f"Error removing physics parameter: {e}")
            raise
