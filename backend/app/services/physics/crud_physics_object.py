"""
CRUD operations for physics objects.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.crud.base import CRUDBase
from backend.app.models.physics.physics_object import PhysicsObject
from backend.app.schemas.physics_object import PhysicsObjectCreate, PhysicsObjectUpdate

class CRUDPhysicsObject(CRUDBase[PhysicsObject, PhysicsObjectCreate, PhysicsObjectUpdate]):
    """CRUD operations for physics objects."""

    async def get_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[PhysicsObject]:
        """Get physics objects for a scene."""
        result = await db.execute(
            select(PhysicsObject)
            .where(PhysicsObject.scene_id == scene_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_with_scene(
        self,
        db: AsyncSession,
        *,
        obj_in: PhysicsObjectCreate
    ) -> PhysicsObject:
        """Create new physics object in a scene."""
        obj_in_data = obj_in.dict()
        db_obj = PhysicsObject(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_with_position(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsObject,
        position: Dict[str, float]
    ) -> PhysicsObject:
        """Update object position."""
        db_obj.position = position
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_with_velocity(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsObject,
        velocity: Dict[str, float]
    ) -> PhysicsObject:
        """Update object velocity."""
        db_obj.velocity = velocity
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_with_rotation(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsObject,
        rotation: Dict[str, float]
    ) -> PhysicsObject:
        """Update object rotation."""
        db_obj.rotation = rotation
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_physics_state(
        self,
        db: AsyncSession,
        *,
        db_obj: PhysicsObject,
        state: Dict[str, Any]
    ) -> PhysicsObject:
        """Update complete physics state."""
        for key, value in state.items():
            if hasattr(db_obj, key):
                setattr(db_obj, key, value)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_name(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        name: str
    ) -> Optional[PhysicsObject]:
        """Get physics object by name in a scene."""
        result = await db.execute(
            select(PhysicsObject)
            .where(PhysicsObject.scene_id == scene_id)
            .where(PhysicsObject.name == name)
        )
        return result.scalar_one_or_none()

    async def get_static_objects(
        self,
        db: AsyncSession,
        *,
        scene_id: int
    ) -> List[PhysicsObject]:
        """Get all static objects in a scene."""
        result = await db.execute(
            select(PhysicsObject)
            .where(PhysicsObject.scene_id == scene_id)
            .where(PhysicsObject.is_static == True)
        )
        return result.scalars().all()

    async def get_dynamic_objects(
        self,
        db: AsyncSession,
        *,
        scene_id: int
    ) -> List[PhysicsObject]:
        """Get all dynamic objects in a scene."""
        result = await db.execute(
            select(PhysicsObject)
            .where(PhysicsObject.scene_id == scene_id)
            .where(PhysicsObject.is_static == False)
        )
        return result.scalars().all()

physics_object = CRUDPhysicsObject(PhysicsObject)
