from typing import Dict, List, Optional, Tuple
import time
import threading
import bisect
from dataclasses import dataclass
from ..models import StoryboardPoint


@dataclass
class TimelineState:
    timestamp: float
    physics_params: Dict
    audio_params: Dict
    harmony_value: float
    transition_duration: float


class StoryboardManager:
    def __init__(self, harmony_engine):
        self.harmony_engine = harmony_engine
        self.timeline: List[TimelineState] = []
        self.current_time = 0.0
        self.is_playing = False
        self.playback_thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()

    def add_point(self, point: StoryboardPoint) -> TimelineState:
        """Add a new point to the timeline."""
        state = TimelineState(
            timestamp=point.timestamp,
            physics_params={
                "gravity": point.gravity,
                "elasticity": point.elasticity,
                "friction": point.friction,
                "air_resistance": point.air_resistance,
                "density": point.density,
            },
            audio_params={
                "waveform": point.waveform,
                "attack": point.attack,
                "decay": point.decay,
                "sustain": point.sustain,
                "release": point.release,
            },
            harmony_value=point.harmony_value,
            transition_duration=point.transition_duration,
        )

        with self.lock:
            # Find insertion point to maintain sorted order
            index = bisect.bisect_left(
                [s.timestamp for s in self.timeline], state.timestamp
            )
            self.timeline.insert(index, state)
            return state

    def remove_point(self, timestamp: float) -> Optional[TimelineState]:
        """Remove a point from the timeline."""
        with self.lock:
            index = bisect.bisect_left([s.timestamp for s in self.timeline], timestamp)
            if (
                index < len(self.timeline)
                and abs(self.timeline[index].timestamp - timestamp) < 0.001
            ):
                return self.timeline.pop(index)
        return None

    def get_state_at_time(
        self, timestamp: float
    ) -> Optional[Tuple[TimelineState, TimelineState, float]]:
        """Get interpolated state at given timestamp."""
        with self.lock:
            if not self.timeline:
                return None

            # Find surrounding states
            next_index = bisect.bisect_right(
                [s.timestamp for s in self.timeline], timestamp
            )

            if next_index == 0:
                return (self.timeline[0], self.timeline[0], 0.0)
            elif next_index >= len(self.timeline):
                return (self.timeline[-1], self.timeline[-1], 1.0)

            prev_state = self.timeline[next_index - 1]
            next_state = self.timeline[next_index]

            # Calculate interpolation factor
            total_duration = next_state.timestamp - prev_state.timestamp
            if total_duration <= 0:
                return (prev_state, next_state, 1.0)

            progress = (timestamp - prev_state.timestamp) / total_duration
            return (prev_state, next_state, progress)

    def interpolate_params(self, start: Dict, end: Dict, progress: float) -> Dict:
        """Interpolate between two parameter sets."""
        result = {}
        for key in start.keys():
            if key in end:
                result[key] = start[key] + (end[key] - start[key]) * progress
        return result

    def update_harmony_engine(self, timestamp: float):
        """Update harmony engine with interpolated state."""
        state_info = self.get_state_at_time(timestamp)
        if not state_info:
            return

        prev_state, next_state, progress = state_info

        # Interpolate parameters
        physics_params = self.interpolate_params(
            prev_state.physics_params, next_state.physics_params, progress
        )

        audio_params = self.interpolate_params(
            prev_state.audio_params, next_state.audio_params, progress
        )

        # Update harmony engine
        self.harmony_engine.update_physics_parameters(physics_params)
        self.harmony_engine.update_audio_parameters(audio_params)

    def play(self, start_time: float = 0.0):
        """Start timeline playback."""
        with self.lock:
            if not self.is_playing and self.timeline:
                self.current_time = start_time
                self.is_playing = True
                self.playback_thread = threading.Thread(target=self._playback_loop)
                self.playback_thread.daemon = True
                self.playback_thread.start()

    def pause(self):
        """Pause timeline playback."""
        with self.lock:
            self.is_playing = False
            if self.playback_thread:
                self.playback_thread.join()
                self.playback_thread = None

    def seek(self, timestamp: float):
        """Seek to specific point in timeline."""
        with self.lock:
            self.current_time = max(0.0, min(timestamp, self.get_duration()))
            self.update_harmony_engine(self.current_time)

    def get_duration(self) -> float:
        """Get total duration of timeline."""
        with self.lock:
            return self.timeline[-1].timestamp if self.timeline else 0.0

    def _playback_loop(self):
        """Main playback loop."""
        last_time = time.time()

        while self.is_playing:
            current_time = time.time()
            delta_time = current_time - last_time

            self.current_time += delta_time
            if self.current_time >= self.get_duration():
                self.current_time = 0.0  # Loop back to start

            self.update_harmony_engine(self.current_time)

            last_time = current_time
            time.sleep(0.016)  # ~60fps update rate
