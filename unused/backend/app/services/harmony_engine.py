from typing import Dict, Optional
import threading
import time
from .physics_simulator import PhysicsSimulator
from .audio_generator import AudioGenerator


class HarmonyEngine:
    def __init__(self, bounds=(0, 100, 0, 100)):
        self.physics = PhysicsSimulator()
        self.audio = AudioGenerator()
        self.bounds = bounds
        self.is_running = False
        self.update_thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        self.frame_time = 0.016  # ~60fps

    def start(self):
        """Start the harmony engine simulation."""
        with self.lock:
            if not self.is_running:
                self.is_running = True
                self.update_thread = threading.Thread(target=self._update_loop)
                self.update_thread.daemon = True
                self.update_thread.start()

    def stop(self):
        """Stop the harmony engine simulation."""
        with self.lock:
            self.is_running = False
            if self.update_thread:
                self.update_thread.join()
                self.update_thread = None

    def _update_loop(self):
        """Main update loop for physics simulation and audio generation."""
        last_time = time.time()

        while self.is_running:
            current_time = time.time()
            delta_time = current_time - last_time

            if delta_time >= self.frame_time:
                # Update physics
                particles = self.physics.update(self.bounds)

                # Map physics state to audio parameters
                audio_params = self.physics.map_to_audio_params()

                # Update audio generation
                if audio_params:
                    self.audio.update_parameters(audio_params)

                last_time = current_time
            else:
                # Sleep for remaining time
                time.sleep(max(0, self.frame_time - delta_time))

    def update_physics_parameters(self, params: Dict):
        """Update physics simulation parameters."""
        with self.lock:
            self.physics.update_parameters(params)

    def update_audio_parameters(self, params: Dict):
        """Update audio generation parameters."""
        with self.lock:
            self.audio.update_parameters(params)

    def add_particle(self, x: float, y: float, mass: float = 1.0):
        """Add a new particle to the simulation."""
        with self.lock:
            return self.physics.create_particle(x, y, mass)

    def get_state(self) -> Dict:
        """Get current state of the harmony engine."""
        with self.lock:
            return {
                "particles": [
                    {
                        "position": particle["position"].tolist(),
                        "velocity": particle["velocity"].tolist(),
                        "mass": particle["mass"],
                    }
                    for particle in self.physics.particles
                ],
                "audio_params": self.physics.map_to_audio_params(),
                "is_running": self.is_running,
            }

    def clear_particles(self):
        """Remove all particles from the simulation."""
        with self.lock:
            self.physics.particles.clear()

    def set_bounds(self, bounds: tuple):
        """Update simulation boundaries."""
        with self.lock:
            self.bounds = bounds

    def generate_audio_file(self, duration: float, filename: str):
        """Generate an audio file based on current parameters."""
        with self.lock:
            audio_params = self.physics.map_to_audio_params()
            if audio_params:
                self.audio.generate_audio_file(duration, filename, **audio_params)
