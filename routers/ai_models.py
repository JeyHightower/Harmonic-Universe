from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID

from database import get_db
from schemas.ai_model import AiModelCreate, AiModelResponse, AiModelUpdate
from models.ai_model import AiModel
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/ai-models",
    tags=["ai-models"],
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AiModelResponse)
def create_ai_model(
    ai_model: AiModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI model"""
    try:
        db_ai_model = AiModel(**ai_model.dict(), user_id=current_user.id)
        db.add(db_ai_model)
        db.commit()
        db.refresh(db_ai_model)
        return db_ai_model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/", response_model=List[AiModelResponse])
def get_user_ai_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all AI models created by the current user"""
    ai_models = db.query(AiModel).filter(AiModel.user_id == current_user.id).all()
    return ai_models

@router.get("/{model_id}", response_model=AiModelResponse)
def get_ai_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific AI model by ID"""
    ai_model = db.query(AiModel).filter(AiModel.id == model_id).first()
    if not ai_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI model not found"
        )

    # Check ownership
    if ai_model.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this AI model"
        )

    return ai_model

@router.put("/{model_id}", response_model=AiModelResponse)
def update_ai_model(
    model_id: UUID,
    ai_model_update: AiModelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an AI model"""
    db_ai_model = db.query(AiModel).filter(AiModel.id == model_id).first()
    if not db_ai_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI model not found"
        )

    # Check ownership
    if db_ai_model.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this AI model"
        )

    # Update the model
    for key, value in ai_model_update.dict(exclude_unset=True).items():
        setattr(db_ai_model, key, value)

    try:
        db.commit()
        db.refresh(db_ai_model)
        return db_ai_model
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_model(
    model_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an AI model"""
    db_ai_model = db.query(AiModel).filter(AiModel.id == model_id).first()
    if not db_ai_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI model not found"
        )

    # Check ownership
    if db_ai_model.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this AI model"
        )

    try:
        db.delete(db_ai_model)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
