"""
CRUD operations for physics constraints.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.crud.base import CRUDBase
from backend.app.models.physics.physics_constraint import PhysicsConstraint
from backend.app.schemas.physics_constraint import PhysicsConstraintCreate, PhysicsConstraintUpdate

class CRUDPhysicsConstraint(CRUDBase[PhysicsConstraint, PhysicsConstraintCreate, PhysicsConstraintUpdate]):
    """CRUD operations for physics constraints."""

    async def get_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PhysicsConstraint]:
        """Get physics constraints for a scene."""
        result = await db.execute(
            select(PhysicsConstraint)
            .where(PhysicsConstraint.scene_id == scene_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_with_scene(
        self,
        db: AsyncSession,
        *,
        obj_in: PhysicsConstraintCreate
    ) -> PhysicsConstraint:
        """Create new physics constraint in a scene."""
        obj_in_data = obj_in.dict()
        db_obj = PhysicsConstraint(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_object(
        self,
        db: AsyncSession,
        *,
        object_id: int
    ) -> List[PhysicsConstraint]:
        """Get all constraints involving a specific object."""
        result = await db.execute(
            select(PhysicsConstraint).where(
                (PhysicsConstraint.object_a_id == object_id) |
                (PhysicsConstraint.object_b_id == object_id)
            )
        )
        return result.scalars().all()

    async def get_by_type(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        constraint_type: str
    ) -> List[PhysicsConstraint]:
        """Get all constraints of a specific type in a scene."""
        result = await db.execute(
            select(PhysicsConstraint)
            .where(PhysicsConstraint.scene_id == scene_id)
            .where(PhysicsConstraint.constraint_type == constraint_type)
        )
        return result.scalars().all()

    async def get_enabled(
        self,
        db: AsyncSession,
        *,
        scene_id: int
    ) -> List[PhysicsConstraint]:
        """Get all enabled constraints in a scene."""
        result = await db.execute(
            select(PhysicsConstraint)
            .where(PhysicsConstraint.scene_id == scene_id)
            .where(PhysicsConstraint.enabled == True)
        )
        return result.scalars().all()

    async def update_limits(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsConstraint,
        limits: Dict[str, Any]
    ) -> PhysicsConstraint:
        """Update constraint limits."""
        db_obj.limits = limits
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_spring_properties(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsConstraint,
        properties: Dict[str, Any]
    ) -> PhysicsConstraint:
        """Update spring constraint properties."""
        db_obj.spring_properties = properties
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def toggle_enabled(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsConstraint
    ) -> PhysicsConstraint:
        """Toggle constraint enabled state."""
        db_obj.enabled = not db_obj.enabled
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_name(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        name: str
    ) -> Optional[PhysicsConstraint]:
        """Get physics constraint by name in a scene."""
        result = await db.execute(
            select(PhysicsConstraint)
            .where(PhysicsConstraint.scene_id == scene_id)
            .where(PhysicsConstraint.name == name)
        )
        return result.scalar_one_or_none()

physics_constraint = CRUDPhysicsConstraint(PhysicsConstraint)
