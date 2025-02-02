from typing import Dict, Any, Optional, List
import asyncio
from pathlib import Path
import json
import ffmpeg
import numpy as np
from PIL import Image
import io
import base64
from datetime import datetime
import os
import shutil
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.export import Export, ExportFormat, ExportStatus
from app.core.config import settings
from app.utils.file_utils import ensure_directory_exists
from app.core.visualization.renderer import Renderer
from app.core.visualization.timeline import TimelineManager

class ExportManager:
    """Manages the export process for scenes."""

    def __init__(
        self,
        scene_data: Dict[str, Any],
        export_data: Dict[str, Any],
        output_dir: Path
    ):
        """Initialize export manager."""
        self.scene_data = scene_data
        self.export_data = export_data
        self.output_dir = output_dir
        self.renderer = Renderer(scene_data)
        self.timeline = TimelineManager(scene_data.get("timeline", {}))
        self.export_path = None
        self.is_cancelled = False
        self.progress = 0.0
        self.frame_buffer: List[Dict[str, Any]] = []
        self._setup_export_directory()

    def _setup_export_directory(self) -> None:
        """Set up the export directory."""
        ensure_directory_exists(self.output_dir)
        self.export_path = self.output_dir / f"export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        ensure_directory_exists(self.export_path)

    async def start_export(self) -> str:
        """Start the export process."""
        try:
            self._setup_export_directory()

            # Export scene data
            await self._export_scene()
            if self.is_cancelled:
                return ""

            # Export parameters
            await self._export_parameters()
            if self.is_cancelled:
                return ""

            # Export video if requested
            if self.export_data.get("format") in [ExportFormat.MP4, ExportFormat.MOV, ExportFormat.AVI]:
                await self._export_video()
                if self.is_cancelled:
                    return ""

            return str(self.export_path)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Export failed: {str(e)}"
            )

    async def _export_video(self) -> None:
        """Export scene as video."""
        try:
            # Get export settings
            settings = self.export_data.get("settings", {})
            fps = settings.get("fps", 30)
            quality = settings.get("quality", "high")
            format = settings.get("format", "mp4")

            # Set up ffmpeg process
            stream = ffmpeg.input(
                f"{self.export_path}/frame_%d.png",
                framerate=fps
            )

            # Add video codec settings based on quality
            if quality == "high":
                stream = stream.output(
                    f"{self.export_path}/output.{format}",
                    vcodec="libx264",
                    crf=18,
                    preset="slow"
                )
            else:
                stream = stream.output(
                    f"{self.export_path}/output.{format}",
                    vcodec="libx264",
                    crf=23,
                    preset="medium"
                )

            # Run the ffmpeg process
            await asyncio.create_subprocess_exec(
                *stream.compile(),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Video export failed: {str(e)}"
            )

    async def _export_scene(self) -> None:
        """Export scene data and frames."""
        try:
            # Export scene metadata
            scene_metadata = {
                "id": str(self.scene_data["id"]),
                "name": self.scene_data["name"],
                "description": self.scene_data.get("description", ""),
                "created_at": self.scene_data["created_at"].isoformat(),
                "updated_at": self.scene_data["updated_at"].isoformat(),
                "export_settings": self.export_data.get("settings", {})
            }

            with open(self.export_path / "metadata.json", "w") as f:
                json.dump(scene_metadata, f, indent=2)

            # Export frames
            total_frames = len(self.scene_data.get("frames", []))
            for i, frame in enumerate(self.scene_data.get("frames", [])):
                if self.is_cancelled:
                    return

                # Render frame
                frame_image = self._render_frame_to_image(
                    frame,
                    self.export_data.get("resolution", {"width": 1920, "height": 1080})
                )

                # Save frame
                frame_path = self.export_path / f"frame_{i:04d}.png"
                Image.fromarray(frame_image).save(frame_path)

                # Update progress
                self.progress = (i + 1) / total_frames * 100

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Scene export failed: {str(e)}"
            )

    async def _export_parameters(self) -> None:
        """Export physics and music parameters."""
        try:
            # Export physics parameters
            physics_params = {
                "parameters": self.scene_data.get("physics_parameters", {}),
                "metadata": {
                    "exported_at": datetime.utcnow().isoformat(),
                    "version": "1.0"
                }
            }

            with open(self.export_path / "physics_parameters.json", "w") as f:
                json.dump(physics_params, f, indent=2)

            # Export music parameters
            music_params = {
                "parameters": self.scene_data.get("music_parameters", {}),
                "metadata": {
                    "exported_at": datetime.utcnow().isoformat(),
                    "version": "1.0"
                }
            }

            with open(self.export_path / "music_parameters.json", "w") as f:
                json.dump(music_params, f, indent=2)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Parameter export failed: {str(e)}"
            )

    def _render_frame_to_image(
        self,
        frame_data: Dict[str, Any],
        resolution: Dict[str, int]
    ) -> np.ndarray:
        """Render a frame to a numpy array."""
        # This is a placeholder. In a real implementation, this would:
        # 1. Set up the renderer
        # 2. Apply frame data
        # 3. Render the frame
        # 4. Convert to numpy array
        return np.zeros((resolution["height"], resolution["width"], 3), dtype=np.uint8)

    def get_progress(self) -> float:
        """Get the current export progress."""
        return self.progress

    def cancel_export(self) -> None:
        """Cancel the export process."""
        self.is_cancelled = True

def create_export(
    db: Session,
    scene_id: UUID,
    format: ExportFormat,
    settings: Optional[Dict[str, Any]] = None
) -> Export:
    """Create a new export."""
    export = Export(
        scene_id=scene_id,
        format=format,
        status=ExportStatus.PENDING,
        settings=settings or {}
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return export

def update_export_progress(
    db: Session,
    export_id: UUID,
    progress: float,
    status: Optional[ExportStatus] = None
) -> Export:
    """Update export progress."""
    export = db.query(Export).filter(Export.id == export_id).first()
    if not export:
        raise HTTPException(
            status_code=404,
            detail=f"Export with id {export_id} not found"
        )

    export.progress = progress
    if status:
        export.status = status

    db.commit()
    db.refresh(export)
    return export

def delete_export(db: Session, export_id: UUID) -> None:
    """Delete an export."""
    export = db.query(Export).filter(Export.id == export_id).first()
    if export:
        # Delete export files if they exist
        if export.output_path and os.path.exists(export.output_path):
            if os.path.isdir(export.output_path):
                shutil.rmtree(export.output_path)
            else:
                os.remove(export.output_path)

        db.delete(export)
        db.commit()
