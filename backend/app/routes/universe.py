"""
Universe routes for the application.
"""

from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.universe import Universe
from app.models.user import User
from app.schemas.universe import (
    UniverseCreate,
    UniverseResponse,
    UniverseUpdate,
    UniverseWithParameters
)

router = APIRouter()

@router.post("/universes", response_model=UniverseResponse)
async def create_universe(
    *,
    db: Session = Depends(get_db),
    universe_in: UniverseCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create new universe."""
    universe = Universe(
        **universe_in.dict(),
        creator_id=current_user.id
    )
    db.add(universe)
    db.commit()
    db.refresh(universe)
    return universe

@router.get("/universes", response_model=List[UniverseResponse])
async def list_universes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """List user's universes."""
    universes = (
        db.query(Universe)
        .filter(
            (Universe.creator_id == current_user.id) | (Universe.is_public == True)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return universes

@router.get("/universes/{universe_id}", response_model=UniverseWithParameters)
async def get_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get universe by ID with its parameters."""
    universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found"
        )
    # Consider restoring access for public universes or collaborators if needed
    if universe.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return universe

@router.put("/universes/{universe_id}", response_model=UniverseResponse)
async def update_universe(
    *,
    universe_id: UUID,
    universe_in: UniverseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update universe."""
    universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found"
        )
    if universe.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    for field, value in universe_in.dict(exclude_unset=True).items():
        setattr(universe, field, value)

    db.add(universe)
    db.commit()
    db.refresh(universe)
    return universe

@router.delete("/universes/{universe_id}")
async def delete_universe(
    universe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete universe."""
    universe = db.query(Universe).filter(Universe.id == universe_id).first()
    if not universe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Universe not found"
        )
    if universe.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    db.delete(universe)
    db.commit()
    return {"status": "success"}
