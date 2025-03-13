"""
Repository for Scene-related database operations.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from backend.app.models.universe.scene import Scene
from backend.app.core.errors import NotFoundError


class SceneRepository:
    """Repository for Scene-related database operations."""

    def __init__(self, session):
        """Initialize with database session."""
        self.session = session

    def get_scenes(self, skip: int = 0, limit: int = 100) -> List[Scene]:
        """Get all scenes with pagination."""
        return self.session.query(Scene).offset(skip).limit(limit).all()

    def get_scenes_by_universe(self, universe_id: str) -> List[Scene]:
        """Get all scenes for a specific universe."""
        return self.session.query(Scene).filter_by(universe_id=universe_id).all()

    def get_scenes_by_creator(self, creator_id: str) -> List[Scene]:
        """Get all scenes created by a specific user."""
        return self.session.query(Scene).filter_by(creator_id=creator_id).all()

    def get_scene_by_id(self, scene_id: str) -> Optional[Scene]:
        """Get a scene by ID."""
        return self.session.query(Scene).filter_by(id=scene_id).first()

    def create_scene(self, scene_data: dict, creator_id: str) -> Scene:
        """Create a new scene."""
        # Ensure creator_id is set
        scene_data["creator_id"] = creator_id

        # Create new scene
        scene = Scene(**scene_data)
        self.session.add(scene)
        self.session.commit()
        self.session.refresh(scene)
        return scene

    def update_scene(self, scene_id: str, scene_data: dict) -> Scene:
        """Update an existing scene."""
        scene = self.get_scene_by_id(scene_id)
        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        # Update fields
        for field, value in scene_data.items():
            if hasattr(scene, field):
                setattr(scene, field, value)

        self.session.commit()
        self.session.refresh(scene)
        return scene

    def delete_scene(self, scene_id: str) -> bool:
        """Delete a scene by ID."""
        scene = self.get_scene_by_id(scene_id)
        if not scene:
            raise NotFoundError(f"Scene {scene_id} not found")

        self.session.delete(scene)
        self.session.commit()
        return True

    def reorder_scenes(
        self, universe_id: str, scene_ids: List[str], current_user_id: str
    ) -> List[Scene]:
        """Reorder scenes in a universe."""
        # Get all scenes for this universe
        scenes = self.get_scenes_by_universe(universe_id)

        # Create a map of scene ID to scene object
        scene_map = {str(scene.id): scene for scene in scenes}

        # Update order of each scene
        for i, scene_id in enumerate(scene_ids):
            if scene_id in scene_map:
                scene = scene_map[scene_id]
                scene.scene_order = i

        self.session.commit()

        # Return the updated scenes
        return self.get_scenes_by_universe(universe_id)
