from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import UUID

from app.models.timeline import Timeline, Animation
from app.models.keyframe import Keyframe
from app.db.session import SessionLocal

class TimelineManager:
    """
    Manages timeline operations, keyframe interpolation, and animation playback.
    """
    def __init__(self, timeline_id: UUID):
        self.timeline_id = timeline_id
        self.db = SessionLocal()
        self.timeline = self._load_timeline()
        self.current_time = 0.0
        self.is_playing = False
        self.loop = False

    def _load_timeline(self) -> Timeline:
        """Load timeline data from the database."""
        timeline = self.db.query(Timeline).filter(Timeline.id == self.timeline_id).first()
        if not timeline:
            raise ValueError(f"Timeline with id {self.timeline_id} not found")
        return timeline

    def get_keyframes_at_time(self, time: float) -> List[Keyframe]:
        """Get all keyframes at a specific time."""
        return self.db.query(Keyframe).filter(
            Keyframe.timeline_id == self.timeline_id,
            Keyframe.time == time
        ).all()

    def get_keyframes_in_range(self, start_time: float, end_time: float) -> List[Keyframe]:
        """Get all keyframes within a time range."""
        return self.db.query(Keyframe).filter(
            Keyframe.timeline_id == self.timeline_id,
            Keyframe.time >= start_time,
            Keyframe.time <= end_time
        ).all()

    def add_keyframe(self, time: float, value: Dict[str, Any], parameter_type: str) -> Keyframe:
        """Add a new keyframe."""
        keyframe = Keyframe(
            timeline_id=self.timeline_id,
            time=time,
            value=value,
            parameter_type=parameter_type
        )
        self.db.add(keyframe)
        self.db.commit()
        self.db.refresh(keyframe)
        return keyframe

    def update_keyframe(self, keyframe_id: UUID, time: Optional[float] = None,
                       value: Optional[Dict[str, Any]] = None) -> Keyframe:
        """Update an existing keyframe."""
        keyframe = self.db.query(Keyframe).filter(Keyframe.id == keyframe_id).first()
        if not keyframe:
            raise ValueError(f"Keyframe with id {keyframe_id} not found")

        if time is not None:
            keyframe.time = time
        if value is not None:
            keyframe.value = value

        self.db.commit()
        self.db.refresh(keyframe)
        return keyframe

    def delete_keyframe(self, keyframe_id: UUID) -> None:
        """Delete a keyframe."""
        keyframe = self.db.query(Keyframe).filter(Keyframe.id == keyframe_id).first()
        if keyframe:
            self.db.delete(keyframe)
            self.db.commit()

    def get_animations(self) -> List[Animation]:
        """Get all animations in the timeline."""
        return self.db.query(Animation).filter(Animation.timeline_id == self.timeline_id).all()

    def add_animation(self, target_object: str, property_path: str,
                     name: str = "New Animation") -> Animation:
        """Add a new animation."""
        animation = Animation(
            timeline_id=self.timeline_id,
            target_object=target_object,
            property_path=property_path,
            name=name
        )
        self.db.add(animation)
        self.db.commit()
        self.db.refresh(animation)
        return animation

    def update_animation(self, animation_id: UUID,
                        name: Optional[str] = None,
                        description: Optional[str] = None) -> Animation:
        """Update an existing animation."""
        animation = self.db.query(Animation).filter(Animation.id == animation_id).first()
        if not animation:
            raise ValueError(f"Animation with id {animation_id} not found")

        if name is not None:
            animation.name = name
        if description is not None:
            animation.description = description

        self.db.commit()
        self.db.refresh(animation)
        return animation

    def delete_animation(self, animation_id: UUID) -> None:
        """Delete an animation."""
        animation = self.db.query(Animation).filter(Animation.id == animation_id).first()
        if animation:
            self.db.delete(animation)
            self.db.commit()

    def play(self) -> None:
        """Start playing the timeline."""
        self.is_playing = True

    def pause(self) -> None:
        """Pause timeline playback."""
        self.is_playing = False

    def stop(self) -> None:
        """Stop timeline playback and reset to start."""
        self.is_playing = False
        self.current_time = 0.0

    def seek(self, time: float) -> None:
        """Seek to a specific time in the timeline."""
        self.current_time = max(0.0, min(time, self.timeline.duration))

    def set_loop(self, loop: bool) -> None:
        """Set whether the timeline should loop."""
        self.loop = loop

    def update(self, delta_time: float) -> None:
        """Update timeline state."""
        if not self.is_playing:
            return

        self.current_time += delta_time
        if self.current_time > self.timeline.duration:
            if self.loop:
                self.current_time = 0.0
            else:
                self.current_time = self.timeline.duration
                self.is_playing = False

    def cleanup(self) -> None:
        """Clean up resources."""
        self.db.close()
