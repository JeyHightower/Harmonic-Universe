"""
Physics parameters endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.PhysicsParameter])
def read_physics_parameters(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve physics parameters.
    """
    universe = crud.universe.get(db=db, id=current_user.active_universe_id)
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found",
        )
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.physics_parameter.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )

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
    universe = crud.universe.get(db=db, id=current_user.active_universe_id)
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found",
        )
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.physics_parameter.create_with_universe(
        db=db, obj_in=parameter_in, universe_id=universe.id
    )

@router.get("/{parameter_id}", response_model=schemas.PhysicsParameter)
def read_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get physics parameter by ID.
    """
    parameter = crud.physics_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return parameter

@router.put("/{parameter_id}", response_model=schemas.PhysicsParameter)
def update_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    parameter_in: schemas.PhysicsParameterUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update physics parameter.
    """
    parameter = crud.physics_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.physics_parameter.update(
        db=db, db_obj=parameter, obj_in=parameter_in
    )

@router.delete("/{parameter_id}", response_model=schemas.PhysicsParameter)
def delete_physics_parameter(
    *,
    db: Session = Depends(deps.get_db),
    parameter_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete physics parameter.
    """
    parameter = crud.physics_parameter.get(db=db, id=parameter_id)
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found",
        )
    universe = crud.universe.get(db=db, id=parameter.universe_id)
    if not crud.universe.is_owner_or_collaborator(
        db=db, universe_id=universe.id, user_id=current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return crud.physics_parameter.remove(db=db, id=parameter_id)
