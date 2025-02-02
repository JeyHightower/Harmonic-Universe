from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/universe/{universe_id}", response_model=List[schemas.PhysicsParameter])
def read_physics_parameters(
    universe_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve physics parameters for a universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    parameters = crud.physics_parameter.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )
    return parameters

@router.post("/", response_model=schemas.PhysicsParameter)
def create_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_in: schemas.PhysicsParameterCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new physics parameter.
    """
    universe = crud.universe.get(db=db, id=parameter_in.universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if parameter with same name exists
    existing_parameter = crud.physics_parameter.get_by_name(
        db=db, universe_id=universe.id, name=parameter_in.name
    )
    if existing_parameter:
        raise HTTPException(
            status_code=400,
            detail=f"Parameter with name '{parameter_in.name}' already exists in this universe",
        )

    parameter = crud.physics_parameter.create_with_universe(
        db=db, obj_in=parameter_in, universe_id=universe.id
    )
    return parameter

@router.put("/{id}", response_model=schemas.PhysicsParameter)
def update_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    parameter_in: schemas.PhysicsParameterUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a physics parameter.
    """
    parameter = crud.physics_parameter.get(db=db, id=id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    parameter = crud.physics_parameter.update(db=db, db_obj=parameter, obj_in=parameter_in)
    return parameter

@router.get("/{id}", response_model=schemas.PhysicsParameter)
def read_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get physics parameter by ID.
    """
    parameter = crud.physics_parameter.get(db=db, id=id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return parameter

@router.delete("/{id}")
def delete_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete physics parameter.
    """
    parameter = crud.physics_parameter.get(db=db, id=id)
    if not parameter:
        raise HTTPException(status_code=404, detail="Physics parameter not found")
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    parameter = crud.physics_parameter.remove(db=db, id=id)
    return {"status": "success"}
