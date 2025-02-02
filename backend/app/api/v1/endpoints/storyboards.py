from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/universe/{universe_id}", response_model=List[schemas.Storyboard])
def read_storyboards(
    universe_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve storyboards for a universe.
    """
    universe = crud.universe.get(db=db, id=universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    storyboards = crud.storyboard.get_by_universe(
        db=db, universe_id=universe.id, skip=skip, limit=limit
    )
    return storyboards

@router.post("/", response_model=schemas.Storyboard)
def create_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    storyboard_in: schemas.StoryboardCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new storyboard.
    """
    universe = crud.universe.get(db=db, id=storyboard_in.universe_id)
    if not universe:
        raise HTTPException(status_code=404, detail="Universe not found")
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if storyboard with same name exists
    existing_storyboard = crud.storyboard.get_by_name(
        db=db, universe_id=universe.id, name=storyboard_in.name
    )
    if existing_storyboard:
        raise HTTPException(
            status_code=400,
            detail=f"Storyboard with name '{storyboard_in.name}' already exists in this universe",
        )

    storyboard = crud.storyboard.create_with_universe(
        db=db, obj_in=storyboard_in, universe_id=universe.id
    )
    return storyboard

@router.put("/{id}", response_model=schemas.Storyboard)
def update_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    storyboard_in: schemas.StoryboardUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    storyboard = crud.storyboard.update(db=db, db_obj=storyboard, obj_in=storyboard_in)
    return storyboard

@router.get("/{id}", response_model=schemas.Storyboard)
def read_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get storyboard by ID.
    """
    storyboard = crud.storyboard.get(db=db, id=id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return storyboard

@router.delete("/{id}")
def delete_storyboard(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    storyboard = crud.storyboard.remove(db=db, id=id)
    return {"status": "success"}
