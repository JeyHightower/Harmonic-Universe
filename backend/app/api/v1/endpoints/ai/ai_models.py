from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.models.ai_model import AIModelType

router = APIRouter()

@router.get("/", response_model=List[schemas.AIModel])
def read_ai_models(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI models.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ai_models = crud.ai_model.get_multi(db, skip=skip, limit=limit)
    return ai_models

@router.get("/type/{model_type}", response_model=List[schemas.AIModel])
def read_ai_models_by_type(
    model_type: AIModelType,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve AI models by type.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ai_models = crud.ai_model.get_by_type(db, model_type=model_type)
    return ai_models

@router.post("/", response_model=schemas.AIModel)
def create_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    ai_model_in: schemas.AIModelCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new AI model.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if model with same name exists
    existing_model = crud.ai_model.get_by_name(db=db, name=ai_model_in.name)
    if existing_model:
        raise HTTPException(
            status_code=400,
            detail=f"AI model with name '{ai_model_in.name}' already exists",
        )

    ai_model = crud.ai_model.create(db=db, obj_in=ai_model_in)
    return ai_model

@router.put("/{id}", response_model=schemas.AIModel)
def update_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    ai_model_in: schemas.AIModelUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update an AI model.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    ai_model = crud.ai_model.update(db=db, db_obj=ai_model, obj_in=ai_model_in)
    return ai_model

@router.get("/{id}", response_model=schemas.AIModel)
def read_ai_model(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get AI model by ID.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
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
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    ai_model = crud.ai_model.get(db=db, id=id)
    if not ai_model:
        raise HTTPException(status_code=404, detail="AI model not found")
    ai_model = crud.ai_model.remove(db=db, id=id)
    return {"status": "success"}
