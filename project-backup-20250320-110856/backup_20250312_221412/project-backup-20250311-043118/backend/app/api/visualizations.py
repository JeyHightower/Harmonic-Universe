from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from uuid import UUID

from database import get_db
from schemas.visualization import VisualizationCreate, VisualizationResponse, VisualizationUpdate
from models.visualization import Visualization
from middleware.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/api/visualizations",
    tags=["visualizations"],
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=VisualizationResponse)
def create_visualization(
    visualization: VisualizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new visualization"""
    try:
        db_visualization = Visualization(**visualization.dict(), user_id=current_user.id)
        db.add(db_visualization)
        db.commit()
        db.refresh(db_visualization)
        return db_visualization
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/user", response_model=List[VisualizationResponse])
def get_user_visualizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all visualizations created by the current user"""
    visualizations = db.query(Visualization).filter(Visualization.user_id == current_user.id).all()
    return visualizations

@router.get("/universe/{universe_id}", response_model=List[VisualizationResponse])
def get_visualizations_by_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all visualizations for a universe"""
    visualizations = db.query(Visualization).filter(Visualization.universe_id == universe_id).all()
    return visualizations

@router.get("/{visualization_id}", response_model=VisualizationResponse)
def get_visualization(
    visualization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific visualization by ID"""
    visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
    if not visualization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visualization not found"
        )
    return visualization

@router.put("/{visualization_id}", response_model=VisualizationResponse)
def update_visualization(
    visualization_id: UUID,
    visualization_update: VisualizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a visualization"""
    db_visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
    if not db_visualization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visualization not found"
        )

    # Check ownership
    if db_visualization.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this visualization"
        )

    # Update the visualization
    for key, value in visualization_update.dict(exclude_unset=True).items():
        setattr(db_visualization, key, value)

    try:
        db.commit()
        db.refresh(db_visualization)
        return db_visualization
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{visualization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visualization(
    visualization_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a visualization"""
    db_visualization = db.query(Visualization).filter(Visualization.id == visualization_id).first()
    if not db_visualization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visualization not found"
        )

    # Check ownership
    if db_visualization.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this visualization"
        )

    try:
        db.delete(db_visualization)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
