"""
CRUD operations for physics parameters.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.crud.base import CRUDBase
from backend.app.models.physics.parameters import PhysicsParameters
from backend.app.schemas.physics.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate

class CRUDPhysicsParameter(CRUDBase[PhysicsParameters, PhysicsParameterCreate, PhysicsParameterUpdate]):
    """CRUD operations for physics parameters."""

    async def get_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: str
    ) -> Optional[PhysicsParameters]:
        """Get physics parameters for a scene."""
        result = await db.execute(
            select(PhysicsParameters).where(PhysicsParameters.scene_id == scene_id)
        )
        return result.scalar_one_or_none()

    async def create_with_scene(
        self,
        db: AsyncSession,
        *,
        obj_in: PhysicsParameterCreate
    ) -> PhysicsParameters:
        """Create new physics parameters for a scene."""
        db_obj = PhysicsParameters(
            scene_id=obj_in.scene_id,
            version=obj_in.version,
            is_active=obj_in.is_active,
            gravity=obj_in.gravity.dict(),
            air_resistance=obj_in.air_resistance.dict(),
            collision_elasticity=obj_in.collision_elasticity.dict(),
            friction=obj_in.friction.dict(),
            temperature=obj_in.temperature.dict(),
            pressure=obj_in.pressure.dict(),
            fluid_density=obj_in.fluid_density.dict(),
            viscosity=obj_in.viscosity.dict(),
            time_step=obj_in.time_step.dict(),
            substeps=obj_in.substeps.dict(),
            custom_parameters={k: v.dict() for k, v in obj_in.custom_parameters.items()}
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_by_scene(
        self,
        db: AsyncSession,
        *,
        scene_id: str,
        obj_in: PhysicsParameterUpdate
    ) -> Optional[PhysicsParameters]:
        """Update physics parameters for a scene."""
        db_obj = await self.get_by_scene(db, scene_id=scene_id)
        if not db_obj:
            return None

        update_data = {}
        for field, value in obj_in.dict(exclude_unset=True).items():
            if value is not None:
                if field == 'custom_parameters':
                    update_data[field] = {k: v.dict() for k, v in value.items()}
                elif isinstance(value, dict):
                    update_data[field] = value
                else:
                    update_data[field] = value.dict()

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def validate_parameters(
        self,
        db: AsyncSession,
        *,
        scene_id: str
    ) -> Dict[str, Any]:
        """Validate physics parameters for a scene."""
        params = await self.get_by_scene(db, scene_id=scene_id)
        if not params:
            return {"valid": False, "errors": ["Physics parameters not found for scene"]}

        errors = []
        for param_name in [
            'gravity', 'air_resistance', 'collision_elasticity', 'friction',
            'temperature', 'pressure', 'fluid_density', 'viscosity',
            'time_step', 'substeps'
        ]:
            param = getattr(params, param_name)
            if param['enabled']:
                if not (param['min'] <= param['value'] <= param['max']):
                    errors.append(
                        f"{param_name}: value {param['value']} is outside range "
                        f"[{param['min']}, {param['max']}]"
                    )

        # Validate custom parameters
        for name, param in params.custom_parameters.items():
            if param['enabled']:
                if not (param['min'] <= param['value'] <= param['max']):
                    errors.append(
                        f"custom parameter {name}: value {param['value']} is outside range "
                        f"[{param['min']}, {param['max']}]"
                    )

        return {
            "valid": len(errors) == 0,
            "errors": errors if errors else None
        }

    async def get_effective_parameters(
        self,
        db: AsyncSession,
        *,
        scene_id: str
    ) -> Dict[str, Any]:
        """Get all enabled parameters with their current values."""
        params = await self.get_by_scene(db, scene_id=scene_id)
        if not params:
            return {}

        result = {}
        for param_name in [
            'gravity', 'air_resistance', 'collision_elasticity', 'friction',
            'temperature', 'pressure', 'fluid_density', 'viscosity',
            'time_step', 'substeps'
        ]:
            param = getattr(params, param_name)
            if param['enabled']:
                result[param_name] = {
                    'value': param['value'],
                    'unit': param['unit']
                }

        # Add enabled custom parameters
        for name, param in params.custom_parameters.items():
            if param['enabled']:
                result[f"custom_{name}"] = {
                    'value': param['value'],
                    'unit': param['unit']
                }

        return result

physics_parameter = CRUDPhysicsParameter(PhysicsParameters)
