"""
CRUD operations for physics parameters.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.physics.physics_parameter import PhysicsParameter
from app.schemas.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate

class CRUDPhysicsParameter(CRUDBase[PhysicsParameter, PhysicsParameterCreate, PhysicsParameterUpdate]):
    """CRUD operations for physics parameters."""

    async def get_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: int
    ) -> Optional[PhysicsParameter]:
        """Get physics parameters for a scene."""
        result = await db.execute(
            select(PhysicsParameter).where(PhysicsParameter.scene_id == scene_id)
        )
        return result.scalar_one_or_none()

    async def create_with_scene(
        self,
        db: AsyncSession,
        *,
        obj_in: PhysicsParameterCreate
    ) -> PhysicsParameter:
        """Create new physics parameters for a scene."""
        db_obj = PhysicsParameter(
            scene_id=obj_in.scene_id,
            gravity=obj_in.gravity,
            air_resistance=obj_in.air_resistance,
            collision_elasticity=obj_in.collision_elasticity,
            friction=obj_in.friction
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: int,
        obj_in: PhysicsParameterUpdate
    ) -> Optional[PhysicsParameter]:
        """Update physics parameters for a scene."""
        db_obj = await self.get_by_scene(db, scene_id=scene_id)
        if not db_obj:
            return None

        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: int
    ) -> Optional[PhysicsParameter]:
        """Remove physics parameters for a scene."""
        db_obj = await self.get_by_scene(db, scene_id=scene_id)
        if not db_obj:
            return None

        await db.delete(db_obj)
        await db.commit()
        return db_obj

physics_parameter = CRUDPhysicsParameter(PhysicsParameter)
