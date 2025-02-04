"""
Scene schemas.
"""

from typing import Dict, List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from pydantic import UUID4, BaseModel, Field
from app.schemas.base import SceneBase, UserBase, UniverseBase

if TYPE_CHECKING:
    from app.schemas.universe import Universe
    from app.schemas.user import User

class SceneCreate(SceneBase):
    """Scene creation schema."""
    universe_id: UUID4

class SceneUpdate(SceneBase):
    """Scene update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    physics_parameters: Optional[Dict] = None
    music_parameters: Optional[Dict] = None

class Scene(SceneBase):
    """Scene schema."""
    id: UUID4
    creator_id: UUID4
    universe_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SceneResponse(Scene):
    """Scene response schema."""
    creator: UserBase
    universe: UniverseBase

    class Config:
        from_attributes = True

class SceneWithParameters(SceneResponse):
    """Scene response schema with detailed parameters."""
    physics_parameters: Dict
    music_parameters: Dict

class RenderSettings(BaseModel):
    """Render settings schema."""
    width: int = 1920
    height: int = 1080
    quality: str = "high"
    format: str = "png"
    frame: Optional[int] = None

class RenderRequest(BaseModel):
    """Render request schema."""
    settings: RenderSettings

class RenderResponse(BaseModel):
    """Render response schema."""
    image_data: str
    metadata: Dict

class ExportSettings(BaseModel):
    """Export settings schema."""
    format: str = "mp4"
    quality: str = "high"
    fps: int = 60
    start_frame: int = 0
    end_frame: Optional[int] = None
    include_audio: bool = True

class ExportRequest(BaseModel):
    """Export request schema."""
    settings: ExportSettings

class ExportResponse(BaseModel):
    """Export response schema."""
    export_id: UUID4
    status: str
