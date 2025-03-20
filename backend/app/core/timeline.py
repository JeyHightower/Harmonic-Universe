from typing import Dict, Any, List, Optional, Callable
import asyncio
from datetime import datetime
import bisect
from app.models.visualization import Timeline, Keyframe, Animation
from app.core.audio.processor import AudioProcessor

class TimelineManager:
    def __init__(self, timeline_data: Dict[str, Any]):
        self.timeline_data = timeline_data
        self.current_time = 0.0
        self.duration = timeline_data["duration"]
        self.fps = timeline_data.get("fps", 60)
        self.is_playing = False
        self.is_looping = False
        self.audio_processor = None
        self.frame_callbacks: List[Callable] = []
        self.marker_callbacks: Dict[str, List[Callable]] = {}
        self._last_update = datetime.now()
        self._keyframes: Dict[str, List[Keyframe]] = {}
        self._sorted_markers = []
        self._initialize()

    def _initialize(self):
        """Initialize timeline data structures."""
        # Initialize audio if present
        if "audio_file" in self.timeline_data:
            self.audio_processor = AudioProcessor(
                self.timeline_data["audio_file"]["file_path"],
                self.timeline_data["audio_file"]["format"]
            )

        # Sort markers
        if "markers" in self.timeline_data:
            self._sorted_markers = sorted(
                self.timeline_data["markers"],
                key=lambda x: x["time"]
            )

        # Organize keyframes by property
        for keyframe in self.timeline_data.get("keyframes", []):
            prop_key = f"{keyframe['animation_id']}:{keyframe['property_name']}"
            if prop_key not in self._keyframes:
                self._keyframes[prop_key] = []
            bisect.insort(
                self._keyframes[prop_key],
                keyframe,
                key=lambda x: x["time"]
            )

    async def start(self):
        """Start timeline playback."""
        self.is_playing = True
        self._last_update = datetime.now()

        while self.is_playing:
            await self._update()
            await asyncio.sleep(1 / self.fps)

    async def stop(self):
        """Stop timeline playback."""
        self.is_playing = False

    async def pause(self):
        """Pause timeline playback."""
        self.is_playing = False

    async def seek(self, time: float):
        """Seek to specific time."""
        self.current_time = max(0, min(time, self.duration))
        await self._process_frame()

    def add_frame_callback(self, callback: Callable):
        """Add callback for frame updates."""
        self.frame_callbacks.append(callback)

    def add_marker_callback(self, marker_id: str, callback: Callable):
        """Add callback for marker events."""
        if marker_id not in self.marker_callbacks:
            self.marker_callbacks[marker_id] = []
        self.marker_callbacks[marker_id].append(callback)

    async def _update(self):
        """Update timeline state."""
        now = datetime.now()
        delta = (now - self._last_update).total_seconds()
        self._last_update = now

        # Update current time
        self.current_time += delta
        if self.current_time >= self.duration:
            if self.is_looping:
                self.current_time = 0
            else:
                await self.stop()
                return

        await self._process_frame()

    async def _process_frame(self):
        """Process current frame."""
        frame_data = self._calculate_frame_state()

        # Check markers
        await self._check_markers()

        # Notify frame callbacks
        for callback in self.frame_callbacks:
            await callback(frame_data)

    def _calculate_frame_state(self) -> Dict[str, Any]:
        """Calculate current frame state including interpolated values."""
        frame_state = {
            "time": self.current_time,
            "properties": {}
        }

        # Calculate interpolated values for each animated property
        for prop_key, keyframes in self._keyframes.items():
            if not keyframes:
                continue

            # Find surrounding keyframes
            next_idx = bisect.bisect_right(
                keyframes,
                self.current_time,
                key=lambda x: x["time"]
            )

            if next_idx == 0:
                # Before first keyframe
                value = keyframes[0]["value"]
            elif next_idx == len(keyframes):
                # After last keyframe
                value = keyframes[-1]["value"]
            else:
                # Interpolate between keyframes
                prev_kf = keyframes[next_idx - 1]
                next_kf = keyframes[next_idx]
                value = self._interpolate_value(
                    prev_kf,
                    next_kf,
                    self.current_time
                )

            frame_state["properties"][prop_key] = value

        return frame_state

    def _interpolate_value(
        self,
        prev_kf: Dict[str, Any],
        next_kf: Dict[str, Any],
        current_time: float
    ) -> Any:
        """Interpolate between keyframe values."""
        t = (current_time - prev_kf["time"]) / (next_kf["time"] - prev_kf["time"])

        if isinstance(prev_kf["value"], (int, float)):
            return self._interpolate_number(
                prev_kf["value"],
                next_kf["value"],
                t,
                prev_kf.get("easing", "linear")
            )
        elif isinstance(prev_kf["value"], dict):
            result = {}
            for key in prev_kf["value"].keys():
                if key in next_kf["value"]:
                    result[key] = self._interpolate_number(
                        prev_kf["value"][key],
                        next_kf["value"][key],
                        t,
                        prev_kf.get("easing", "linear")
                    )
            return result

        return prev_kf["value"]

    def _interpolate_number(
        self,
        start: float,
        end: float,
        t: float,
        easing: str
    ) -> float:
        """Interpolate between two numbers with easing."""
        if easing == "linear":
            return start + (end - start) * t
        elif easing == "ease-in":
            return start + (end - start) * (t * t)
        elif easing == "ease-out":
            return start + (end - start) * (1 - (1 - t) * (1 - t))
        elif easing == "ease-in-out":
            t2 = 2 * t
            if t2 < 1:
                return start + (end - start) * 0.5 * t2 * t2
            t2 = 2 * (t - 1)
            return start + (end - start) * (0.5 * ((t2 * t2) + 2))

        return start + (end - start) * t

    async def _check_markers(self):
        """Check and trigger marker callbacks."""
        for marker in self._sorted_markers:
            if (marker["time"] <= self.current_time and
                marker["time"] > self.current_time - (1 / self.fps)):
                if marker["id"] in self.marker_callbacks:
                    for callback in self.marker_callbacks[marker["id"]]:
                        await callback(marker)
