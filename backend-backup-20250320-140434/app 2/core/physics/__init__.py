"""Physics core functionality."""

from typing import Dict, Any, List
import numpy as np

class PhysicsEngine:
    """Core physics engine functionality."""

    def __init__(self):
        self.gravity = np.array([0, -9.81, 0])
        self.time_step = 1/60  # 60 FPS

    def apply_forces(self, objects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply physics forces to objects."""
        for obj in objects:
            if obj.get("physics_enabled", True):
                # Apply gravity
                acceleration = self.gravity
                velocity = np.array(obj.get("velocity", [0, 0, 0]))
                position = np.array(obj.get("position", [0, 0, 0]))

                # Update velocity and position
                velocity += acceleration * self.time_step
                position += velocity * self.time_step

                # Update object
                obj["velocity"] = velocity.tolist()
                obj["position"] = position.tolist()

        return objects

    def check_collisions(self, objects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Check for collisions between objects."""
        # Basic collision detection
        for i, obj1 in enumerate(objects):
            for j, obj2 in enumerate(objects[i+1:], i+1):
                if (obj1.get("physics_enabled", True) and
                    obj2.get("physics_enabled", True)):
                    # Simple sphere collision check
                    pos1 = np.array(obj1.get("position", [0, 0, 0]))
                    pos2 = np.array(obj2.get("position", [0, 0, 0]))
                    radius1 = obj1.get("radius", 1.0)
                    radius2 = obj2.get("radius", 1.0)

                    distance = np.linalg.norm(pos2 - pos1)
                    if distance < (radius1 + radius2):
                        # Handle collision
                        normal = (pos2 - pos1) / distance
                        overlap = (radius1 + radius2) - distance

                        # Move objects apart
                        if not obj1.get("is_static", False):
                            obj1["position"] = (pos1 - normal * overlap/2).tolist()
                        if not obj2.get("is_static", False):
                            obj2["position"] = (pos2 + normal * overlap/2).tolist()

        return objects

physics_engine = PhysicsEngine()
