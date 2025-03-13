from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID

from database import get_db
from schemas.physics_parameter import PhysicsParameterCreate, PhysicsParameterResponse, PhysicsParameterUpdate
from models.physics_parameter import PhysicsParameter
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/physics-parameters",
    tags=["physics-parameters"],
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=PhysicsParameterResponse)
def create_physics_parameter(
    physics_param: PhysicsParameterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new physics parameter"""
    try:
        db_physics_param = PhysicsParameter(**physics_param.dict())
        db.add(db_physics_param)
        db.commit()
        db.refresh(db_physics_param)
        return db_physics_param
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/universe/{universe_id}", response_model=List[PhysicsParameterResponse])
def get_physics_parameters_by_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all physics parameters for a universe"""
    parameters = db.query(PhysicsParameter).filter(PhysicsParameter.universe_id == universe_id).all()
    return parameters

@router.get("/{parameter_id}", response_model=PhysicsParameterResponse)
def get_physics_parameter(
    parameter_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific physics parameter by ID"""
    parameter = db.query(PhysicsParameter).filter(PhysicsParameter.id == parameter_id).first()
    if not parameter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found"
        )
    return parameter

@router.put("/{parameter_id}", response_model=PhysicsParameterResponse)
def update_physics_parameter(
    parameter_id: UUID,
    physics_param: PhysicsParameterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a physics parameter"""
    db_physics_param = db.query(PhysicsParameter).filter(PhysicsParameter.id == parameter_id).first()
    if not db_physics_param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found"
        )

    # Update the parameter
    for key, value in physics_param.dict(exclude_unset=True).items():
        setattr(db_physics_param, key, value)

    try:
        db.commit()
        db.refresh(db_physics_param)
        return db_physics_param
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_physics_parameter(
    parameter_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a physics parameter"""
    db_physics_param = db.query(PhysicsParameter).filter(PhysicsParameter.id == parameter_id).first()
    if not db_physics_param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physics parameter not found"
        )

    try:
        db.delete(db_physics_param)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
