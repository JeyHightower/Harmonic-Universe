from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models
from app.schemas.ai_model import AIModel, AIModelCreate, AIModelUpdate
from app.api import deps
from app.models.ai.ai_model import AIModelType

router = APIRouter()

@router.get("/", response_model=List[AIModel])
def read_ai_models(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI models.
    """
    if crud.user.is_superuser(current_user):
        ai_models = crud.ai_model.get_multi(db, skip=skip, limit=limit)
    else:
        ai_models = crud.ai_model.get_multi_by_owner(
            db=db, owner_id=current_user.id, skip=skip, limit=limit
        )
    return ai_models

@router.get("/type/{model_type}", response_model=List[AIModel])
def read_ai_models_by_type(
    model_type: AIModelType,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI models by type.
    """
    ai_models = crud.ai_model.get_by_type(
        db=db, model_type=model_type
    )
    return ai_models

@router.post("/", response_model=AIModel)
def create_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    ai_model_in: AIModelCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new AI model.
    """
    ai_model = crud.ai_model.create_with_owner(
        db=db, obj_in=ai_model_in, owner_id=current_user.id
    )
    return ai_model

@router.put("/{id}", response_model=AIModel)
def update_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    ai_model_in: AIModelUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update AI model.
    """
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    if not crud.user.is_superuser(current_user) and (ai_model.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    ai_model = crud.ai_model.update(db=db, db_obj=ai_model, obj_in=ai_model_in)
    return ai_model

@router.get("/{id}", response_model=AIModel)
def read_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI model by ID.
    """
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    if not crud.user.is_superuser(current_user) and (ai_model.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return ai_model

@router.delete("/{id}")
def delete_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete AI model.
    """
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    if not crud.user.is_superuser(current_user) and (ai_model.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    ai_model = crud.ai_model.remove(db=db, id=id)
    return ai_model
