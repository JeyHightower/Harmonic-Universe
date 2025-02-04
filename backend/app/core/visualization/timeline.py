from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import UUID
import asyncio

from app.models.timeline import Timeline, Animation
from app.models.keyframe import Keyframe
from app.db.session import SessionLocal
from app.core.config import settings

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
        self.playback_speed = 1.0
        self.animations: List[Animation] = []
        self.last_update = datetime.now()

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

    def add_animation(self, animation: Animation) -> None:
        """Add animation to timeline."""
        self.animations.append(animation)

    def remove_animation(self, animation_id: str) -> None:
        """Remove animation from timeline."""
        self.animations = [a for a in self.animations if a.id != animation_id]

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

    def set_time(self, time: float) -> None:
        """Set current time."""
        self.current_time = max(0.0, min(time, self.timeline.duration))

    def set_playback_speed(self, speed: float) -> None:
        """Set playback speed."""
        self.playback_speed = max(0.1, min(speed, 10.0))

    def set_loop(self, loop: bool) -> None:
        """Set loop mode."""
        self.loop = loop

    def get_duration(self) -> float:
        """Get total duration."""
        if not self.animations:
            return 0.0
        return max(a.end_time for a in self.animations)

    async def start(self) -> None:
        """Start playback."""
        if not self.is_playing:
            self.is_playing = True
            self.last_update = datetime.now()
            await self._update_loop()

    async def stop(self) -> None:
        """Stop playback."""
        self.is_playing = False
        self.current_time = 0.0

    async def pause(self) -> None:
        """Pause playback."""
        self.is_playing = False

    async def resume(self) -> None:
        """Resume playback."""
        if not self.is_playing:
            self.is_playing = True
            self.last_update = datetime.now()
            await self._update_loop()

    async def seek(self, time: float) -> None:
        """Seek to specific time."""
        self.set_time(time)
        await self._update_animations()

    async def _update_loop(self) -> None:
        """Main update loop."""
        while self.is_playing:
            now = datetime.now()
            delta = (now - self.last_update).total_seconds() * self.playback_speed
            self.last_update = now

            self.current_time += delta
            if self.current_time >= self.get_duration():
                if self.loop:
                    self.current_time = 0.0
                else:
                    await self.stop()
                    break

            await self._update_animations()
            await asyncio.sleep(1/60)  # 60 FPS target

    async def _update_animations(self) -> None:
        """Update all active animations."""
        for animation in self.animations:
            if animation.start_time <= self.current_time <= animation.end_time:
                progress = (self.current_time - animation.start_time) / (animation.end_time - animation.start_time)
                await self._apply_animation(animation, progress)

    async def _apply_animation(self, animation: Animation, progress: float) -> None:
        """Apply animation at current progress."""
        # TODO: Implement actual animation logic
        pass

    def cleanup(self) -> None:
        """Clean up resources."""
        self.db.close()
