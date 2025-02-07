"""
Physics API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.physics import (
    crud_physics_object,
    crud_physics_constraint,
    crud_physics_parameter
)
from app.schemas.physics import (
    PhysicsObject,
    PhysicsObjectCreate,
    PhysicsObjectUpdate,
    PhysicsConstraint,
    PhysicsConstraintCreate,
    PhysicsConstraintUpdate,
    PhysicsParameter,
    PhysicsParameterCreate,
    PhysicsParameterUpdate
)

router = APIRouter()

# Physics Objects
@router.get("/objects/", response_model=List[PhysicsObject])
def read_physics_objects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[PhysicsObject]:
    """Retrieve physics objects."""
    return crud_physics_object.get_multi(db, skip=skip, limit=limit)

@router.post("/objects/", response_model=PhysicsObject)
def create_physics_object(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: PhysicsObjectCreate
) -> PhysicsObject:
    """Create new physics object."""
    return crud_physics_object.create(db, obj_in=obj_in)

@router.get("/objects/{object_id}", response_model=PhysicsObject)
def read_physics_object(
    object_id: int,
    db: Session = Depends(deps.get_db)
) -> PhysicsObject:
    """Get specific physics object."""
    obj = crud_physics_object.get(db, id=object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Physics object not found")
    return obj

@router.put("/objects/{object_id}", response_model=PhysicsObject)
def update_physics_object(
    *,
    db: Session = Depends(deps.get_db),
    object_id: int,
    obj_in: PhysicsObjectUpdate
) -> PhysicsObject:
    """Update physics object."""
    obj = crud_physics_object.get(db, id=object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Physics object not found")
    return crud_physics_object.update(db, db_obj=obj, obj_in=obj_in)

@router.delete("/objects/{object_id}")
def delete_physics_object(
    *,
    db: Session = Depends(deps.get_db),
    object_id: int
) -> dict:
    """Delete physics object."""
    obj = crud_physics_object.get(db, id=object_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Physics object not found")
    crud_physics_object.remove(db, id=object_id)
    return {"status": "success"}

# Physics Constraints
@router.get("/constraints/", response_model=List[PhysicsConstraint])
def read_physics_constraints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[PhysicsConstraint]:
    """Retrieve physics constraints."""
    return crud_physics_constraint.get_multi(db, skip=skip, limit=limit)

@router.post("/constraints/", response_model=PhysicsConstraint)
def create_physics_constraint(
    *,
    db: Session = Depends(deps.get_db),
    constraint_in: PhysicsConstraintCreate
) -> PhysicsConstraint:
    """Create new physics constraint."""
    return crud_physics_constraint.create(db, obj_in=constraint_in)

@router.get("/constraints/{constraint_id}", response_model=PhysicsConstraint)
def read_physics_constraint(
    constraint_id: int,
    db: Session = Depends(deps.get_db)
) -> PhysicsConstraint:
    """Get specific physics constraint."""
    constraint = crud_physics_constraint.get(db, id=constraint_id)
    if not constraint:
        raise HTTPException(status_code=404, detail="Physics constraint not found")
    return constraint

@router.put("/constraints/{constraint_id}", response_model=PhysicsConstraint)
def update_physics_constraint(
    *,
    db: Session = Depends(deps.get_db),
    constraint_id: int,
    constraint_in: PhysicsConstraintUpdate
) -> PhysicsConstraint:
    """Update physics constraint."""
    constraint = crud_physics_constraint.get(db, id=constraint_id)
    if not constraint:
        raise HTTPException(status_code=404, detail="Physics constraint not found")
    return crud_physics_constraint.update(db, db_obj=constraint, obj_in=constraint_in)

@router.delete("/constraints/{constraint_id}")
def delete_physics_constraint(
    *,
    db: Session = Depends(deps.get_db),
    constraint_id: int
) -> dict:
    """Delete physics constraint."""
    constraint = crud_physics_constraint.get(db, id=constraint_id)
    if not constraint:
        raise HTTPException(status_code=404, detail="Physics constraint not found")
    crud_physics_constraint.remove(db, id=constraint_id)
    return {"status": "success"}

# Physics Parameters
@router.get("/parameters/", response_model=List[PhysicsParameter])
def read_physics_parameters(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> List[PhysicsParameter]:
    """Retrieve physics parameters."""
    return crud_physics_parameter.get_multi(db, skip=skip, limit=limit)

@router.post("/parameters/", response_model=PhysicsParameter)
def create_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_in: PhysicsParameterCreate
) -> PhysicsParameter:
    """Create new physics parameter."""
    return crud_physics_parameter.create(db, obj_in=parameter_in)

@router.get("/parameters/{parameter_id}", response_model=PhysicsParameter)
def read_physics_parameter(
    parameter_id: int,
    db: Session = Depends(deps.get_db)
) -> PhysicsParameter:
    """Get specific physics parameter."""
    parameter = crud_physics_parameter.get(db, id=parameter_id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    return parameter

@router.put("/parameters/{parameter_id}", response_model=PhysicsParameter)
def update_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: int,
    parameter_in: PhysicsParameterUpdate
) -> PhysicsParameter:
    """Update physics parameter."""
    parameter = crud_physics_parameter.get(db, id=parameter_id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    return crud_physics_parameter.update(db, db_obj=parameter, obj_in=parameter_in)

@router.delete("/parameters/{parameter_id}")
def delete_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: int
) -> dict:
    """Delete physics parameter."""
    parameter = crud_physics_parameter.get(db, id=parameter_id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    crud_physics_parameter.remove(db, id=parameter_id)
    return {"status": "success"}
