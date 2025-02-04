from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app import crud, models, schemas
from app.api import deps
from app.models.visualization.keyframe import ParameterType

router = APIRouter()

@router.get("/storyboard/{storyboard_id}", response_model=List[schemas.Keyframe])
def read_keyframes(
    storyboard_id: str,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve keyframes for a storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    keyframes = crud.keyframe.get_by_storyboard(
        db=db, storyboard_id=storyboard.id, skip=skip, limit=limit
    )
    return keyframes

@router.get("/storyboard/{storyboard_id}/parameter", response_model=List[schemas.Keyframe])
def read_keyframes_by_parameter(
    storyboard_id: str,
    parameter_type: ParameterType,
    parameter_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve keyframes for a specific parameter in a storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    keyframes = crud.keyframe.get_by_parameter(
        db=db,
        storyboard_id=storyboard.id,
        parameter_type=parameter_type,
        parameter_id=parameter_id
    )
    return keyframes

@router.get("/storyboard/{storyboard_id}/timerange", response_model=List[schemas.Keyframe])
def read_keyframes_by_timerange(
    storyboard_id: str,
    start_time: float = Query(..., description="Start time in seconds"),
    end_time: float = Query(..., description="End time in seconds"),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve keyframes within a time range in a storyboard.
    """
    storyboard = crud.storyboard.get(db=db, id=storyboard_id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    keyframes = crud.keyframe.get_by_timestamp_range(
        db=db,
        storyboard_id=storyboard.id,
        start_time=start_time,
        end_time=end_time
    )
    return keyframes

@router.post("/", response_model=schemas.Keyframe)
def create_keyframe(
    *,
    db: Session = Depends(deps.get_db),
    keyframe_in: schemas.KeyframeCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new keyframe.
    """
    storyboard = crud.storyboard.get(db=db, id=keyframe_in.storyboard_id)
    if not storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    keyframe = crud.keyframe.create_with_storyboard(
        db=db, obj_in=keyframe_in, storyboard_id=storyboard.id
    )
    return keyframe

@router.put("/{id}", response_model=schemas.Keyframe)
def update_keyframe(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    keyframe_in: schemas.KeyframeUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a keyframe.
    """
    keyframe = crud.keyframe.get(db=db, id=id)
    if not keyframe:
        raise HTTPException(status_code=404, detail="Keyframe not found")
    storyboard = crud.storyboard.get(db=db, id=keyframe.storyboard_id)
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    keyframe = crud.keyframe.update(db=db, db_obj=keyframe, obj_in=keyframe_in)
    return keyframe

@router.delete("/{id}")
def delete_keyframe(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete keyframe.
    """
    keyframe = crud.keyframe.get(db=db, id=id)
    if not keyframe:
        raise HTTPException(status_code=404, detail="Keyframe not found")
    storyboard = crud.storyboard.get(db=db, id=keyframe.storyboard_id)
    universe = crud.universe.get(db=db, id=storyboard.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    keyframe = crud.keyframe.remove(db=db, id=id)
    return {"status": "success"}
