"""
Physics routes.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_current_user, get_async_db
from app.models.core.user import User
from app.models.core.scene import Scene
from app.models.physics.physics_parameter import PhysicsParameter
from app.models.physics.physics_object import PhysicsObject
from app.models.physics.physics_constraint import PhysicsConstraint
from app.core.physics import physics_engine
from app.schemas.physics_parameter import PhysicsParameterCreate, PhysicsParameterUpdate
from app.schemas.physics_object import PhysicsObjectCreate, PhysicsObjectUpdate
from app.schemas.physics_constraint import PhysicsConstraintCreate, PhysicsConstraintUpdate

router = APIRouter()

@router.get("/scenes/{scene_id}/parameters", response_model=PhysicsParameter)
async def get_scene_physics_parameters(
    scene_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get scene physics parameters."""
    params = await db.get(PhysicsParameter, scene_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found"
        )
    return params

@router.put("/scenes/{scene_id}/parameters", response_model=PhysicsParameter)
async def update_scene_physics_parameters(
    scene_id: int,
    params_in: PhysicsParameterUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Update scene physics parameters."""
    params = await db.get(PhysicsParameter, scene_id)
    if not params:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameters not found"
        )

    # Update parameters
    for field, value in params_in.dict(exclude_unset=True).items():
        setattr(params, field, value)

    await db.commit()
    await db.refresh(params)
    return params

@router.post("/scenes/{scene_id}/simulate")
async def simulate_scene(
    scene_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Run physics simulation for a scene."""
    scene = await db.get(Scene, scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )

    # Get all physics objects in the scene
    objects = await db.execute(
        select(PhysicsObject).where(PhysicsObject.scene_id == scene_id)
    )
    objects = objects.scalars().all()

    # Convert to list of dicts for physics engine
    object_data = [obj.to_dict() for obj in objects]

    # Run simulation step
    updated_objects = physics_engine.apply_forces(object_data)
    updated_objects = physics_engine.check_collisions(updated_objects)

    # Update objects in database
    for obj_data in updated_objects:
        obj = next(obj for obj in objects if obj.id == obj_data["id"])
        for field, value in obj_data.items():
            if hasattr(obj, field):
                setattr(obj, field, value)

    await db.commit()
    return {"status": "success", "updated_objects": len(updated_objects)}

@router.post("/scenes/{scene_id}/objects", response_model=PhysicsObject)
async def create_physics_object(
    scene_id: int,
    obj_in: PhysicsObjectCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new physics object."""
    scene = await db.get(Scene, scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )

    obj = PhysicsObject(**obj_in.dict(), scene_id=scene_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj

@router.get("/scenes/{scene_id}/objects/{object_id}", response_model=PhysicsObject)
async def get_physics_object(
    scene_id: int,
    object_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get a physics object."""
    obj = await db.get(PhysicsObject, object_id)
    if not obj or obj.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics object not found"
        )
    return obj

@router.put("/scenes/{scene_id}/objects/{object_id}", response_model=PhysicsObject)
async def update_physics_object(
    scene_id: int,
    object_id: int,
    obj_in: PhysicsObjectUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Update a physics object."""
    obj = await db.get(PhysicsObject, object_id)
    if not obj or obj.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics object not found"
        )

    # Update object
    for field, value in obj_in.dict(exclude_unset=True).items():
        setattr(obj, field, value)

    await db.commit()
    await db.refresh(obj)
    return obj

@router.delete("/scenes/{scene_id}/objects/{object_id}")
async def delete_physics_object(
    scene_id: int,
    object_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a physics object."""
    obj = await db.get(PhysicsObject, object_id)
    if not obj or obj.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics object not found"
        )

    await db.delete(obj)
    await db.commit()
    return {"status": "success"}

@router.post("/scenes/{scene_id}/constraints", response_model=PhysicsConstraint)
async def create_physics_constraint(
    scene_id: int,
    constraint_in: PhysicsConstraintCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new physics constraint."""
    scene = await db.get(Scene, scene_id)
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found"
        )

    constraint = PhysicsConstraint(**constraint_in.dict(), scene_id=scene_id)
    db.add(constraint)
    await db.commit()
    await db.refresh(constraint)
    return constraint

@router.get("/scenes/{scene_id}/constraints/{constraint_id}", response_model=PhysicsConstraint)
async def get_physics_constraint(
    scene_id: int,
    constraint_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Get a physics constraint."""
    constraint = await db.get(PhysicsConstraint, constraint_id)
    if not constraint or constraint.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics constraint not found"
        )
    return constraint

@router.put("/scenes/{scene_id}/constraints/{constraint_id}", response_model=PhysicsConstraint)
async def update_physics_constraint(
    scene_id: int,
    constraint_id: int,
    constraint_in: PhysicsConstraintUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Update a physics constraint."""
    constraint = await db.get(PhysicsConstraint, constraint_id)
    if not constraint or constraint.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics constraint not found"
        )

    # Update constraint
    for field, value in constraint_in.dict(exclude_unset=True).items():
        setattr(constraint, field, value)

    await db.commit()
    await db.refresh(constraint)
    return constraint

@router.delete("/scenes/{scene_id}/constraints/{constraint_id}")
async def delete_physics_constraint(
    scene_id: int,
    constraint_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a physics constraint."""
    constraint = await db.get(PhysicsConstraint, constraint_id)
    if not constraint or constraint.scene_id != scene_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics constraint not found"
        )

    await db.delete(constraint)
    await db.commit()
    return {"status": "success"}
