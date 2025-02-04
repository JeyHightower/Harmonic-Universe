from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pathlib import Path

from app import crud, models, schemas
from app.api import deps
from app.core.visualization.renderer import Renderer
from app.core.visualization.timeline import TimelineManager
from app.core.visualization.export import ExportManager
from app.core.config import settings

router = APIRouter()

@router.websocket("/scene/{scene_id}/stream")
async def stream_scene(
    websocket: WebSocket,
    scene_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Stream scene visualization data over WebSocket.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Initialize renderer and timeline
    renderer = Renderer(scene.dict())
    timeline = TimelineManager(scene.timeline.dict() if scene.timeline else {})

    try:
        # Add client to renderer
        await renderer.add_client(websocket)

        # Start rendering loop
        await renderer.start()

        # Handle WebSocket messages
        while True:
            try:
                message = await websocket.receive_json()
                command = message.get("command")

                if command == "play":
                    await timeline.start()
                elif command == "pause":
                    await timeline.pause()
                elif command == "stop":
                    await timeline.stop()
                elif command == "seek":
                    await timeline.seek(message.get("time", 0))
                elif command == "update_camera":
                    scene.camera_settings.update(message.get("camera", {}))
                    db.commit()

            except WebSocketDisconnect:
                break

    finally:
        await renderer.stop()
        await timeline.stop()
        await renderer.remove_client(websocket)

@router.post("/scene/{scene_id}/export", response_model=schemas.Export)
async def create_export(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    export_in: schemas.ExportCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new export job.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Create export record
    export = crud.export.create(db=db, obj_in=export_in)

    # Initialize export manager
    export_dir = Path(settings.EXPORT_DIR) / str(export.id)
    manager = ExportManager(
        scene_data=scene.dict(),
        export_data=export_in.dict(),
        output_dir=export_dir
    )

    # Start export process
    try:
        await manager.start_export()
        export.status = "completed"
        export.progress = 100.0
    except Exception as e:
        export.status = "failed"
        export.metadata = {"error": str(e)}

    db.commit()
    db.refresh(export)

    return export

@router.get("/scene/{scene_id}/export/{export_id}", response_model=schemas.Export)
def read_export(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    export_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get export status.
    """
    export = crud.export.get(db=db, id=export_id)
    if not export or export.scene_id != scene_id:
        raise HTTPException(status_code=404, detail="Export not found")

    scene = crud.scene.get(db=db, id=scene_id)
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return export

@router.delete("/scene/{scene_id}/export/{export_id}")
def delete_export(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    export_id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete export.
    """
    export = crud.export.get(db=db, id=export_id)
    if not export or export.scene_id != scene_id:
        raise HTTPException(status_code=404, detail="Export not found")

    scene = crud.scene.get(db=db, id=scene_id)
    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Delete export files
    export_dir = Path(settings.EXPORT_DIR) / str(export.id)
    if export_dir.exists():
        for file in export_dir.glob("**/*"):
            if file.is_file():
                file.unlink()
        for dir in reversed(list(export_dir.glob("**/*"))):
            if dir.is_dir():
                dir.rmdir()
        export_dir.rmdir()

    crud.export.remove(db=db, id=export_id)
    return {"status": "success"}

@router.post("/scene/{scene_id}/parameter-visual", response_model=schemas.SceneObject)
def create_parameter_visual(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    visual_in: schemas.ParameterVisualCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new parameter visualization object.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Create scene object for visualization
    object_in = schemas.SceneObjectCreate(
        scene_id=scene_id,
        name=visual_in.name,
        type=models.SceneObjectType.PARAMETER_VISUAL,
        parameters=visual_in.dict()
    )

    return crud.scene_object.create(db=db, obj_in=object_in)

@router.put("/scene/{scene_id}/parameter-visual/{visual_id}", response_model=schemas.SceneObject)
def update_parameter_visual(
    *,
    db: Session = Depends(deps.get_db),
    scene_id: str,
    visual_id: str,
    visual_in: schemas.ParameterVisualUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update parameter visualization object.
    """
    scene = crud.scene.get(db=db, id=scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    universe = crud.universe.get(db=db, id=scene.universe_id)
    if not crud.universe.is_owner_or_collaborator(db=db, universe_id=universe.id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    visual = crud.scene_object.get(db=db, id=visual_id)
    if not visual or visual.scene_id != scene_id:
        raise HTTPException(status_code=404, detail="Visual not found")

    # Update scene object
    object_in = schemas.SceneObjectUpdate(parameters=visual_in.dict())
    return crud.scene_object.update(db=db, db_obj=visual, obj_in=object_in)
