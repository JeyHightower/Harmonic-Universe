"""Physics simulation manager for the application."""
from typing import List, Dict, Any
from app.models import PhysicsObject, PhysicsConstraint, Scene
from app.extensions import db
import math

class CollisionPair:
    """Represents a collision between two physics objects."""
    def __init__(self, object_a: PhysicsObject, object_b: PhysicsObject,
                 contact_point: Dict[str, float], normal: Dict[str, float],
                 penetration: float):
        self.object_a = object_a
        self.object_b = object_b
        self.contact_point = contact_point
        self.normal = normal
        self.penetration = penetration

class PhysicsSimulationManager:
    """Manages physics simulations for scenes."""

    def __init__(self):
        self.gravity = {"x": 0, "y": -9.81}
        self.time_step = 1/60  # 60 FPS
        self.collision_iterations = 4
        self.position_iterations = 3
        self.velocity_iterations = 8

    def update_scene(self, scene: Scene):
        """Update physics for all objects in a scene."""
        objects = scene.physics_objects
        constraints = []
        for obj in objects:
            constraints.extend(obj.constraints)

        # Apply gravity
        self._apply_gravity(objects)

        # Update velocities and positions
        self._integrate_velocities(objects)
        self._integrate_positions(objects)

        # Handle collisions
        for _ in range(self.collision_iterations):
            collisions = self._detect_collisions(objects)
            self._resolve_collisions(collisions)

        # Apply constraints
        for _ in range(self.position_iterations):
            for constraint in constraints:
                constraint.apply_constraint_forces()

        # Final velocity update
        for _ in range(self.velocity_iterations):
            self._integrate_velocities(objects)

        # Update database
        db.session.commit()

    def _apply_gravity(self, objects: List[PhysicsObject]):
        """Apply gravity to all non-static objects."""
        for obj in objects:
            if not obj.is_static:
                obj.apply_force(
                    self.gravity["x"] * obj.mass,
                    self.gravity["y"] * obj.mass
                )

    def _integrate_velocities(self, objects: List[PhysicsObject]):
        """Update velocities based on forces."""
        for obj in objects:
            obj.update_physics(self.time_step)

    def _integrate_positions(self, objects: List[PhysicsObject]):
        """Update positions based on velocities."""
        for obj in objects:
            if not obj.is_static:
                obj.position["x"] += obj.velocity["x"] * self.time_step
                obj.position["y"] += obj.velocity["y"] * self.time_step

    def _detect_collisions(self, objects: List[PhysicsObject]) -> List[CollisionPair]:
        """Detect collisions between objects."""
        collisions = []
        for i, obj_a in enumerate(objects):
            for obj_b in objects[i + 1:]:
                if (obj_a.is_static and obj_b.is_static) or \
                   not self._check_collision_filters(obj_a, obj_b):
                    continue

                collision = self._check_collision(obj_a, obj_b)
                if collision:
                    collisions.append(collision)
        return collisions

    def _check_collision_filters(self, obj_a: PhysicsObject, obj_b: PhysicsObject) -> bool:
        """Check if objects can collide based on their collision filters."""
        return (obj_a.collision_filter["category"] & obj_b.collision_filter["mask"]) != 0 and \
               (obj_b.collision_filter["category"] & obj_a.collision_filter["mask"]) != 0

    def _check_collision(self, obj_a: PhysicsObject, obj_b: PhysicsObject) -> CollisionPair:
        """Check collision between two objects."""
        if obj_a.object_type == "circle" and obj_b.object_type == "circle":
            return self._check_circle_circle_collision(obj_a, obj_b)
        # Add more collision checks for different shape combinations
        return None

    def _check_circle_circle_collision(self, obj_a: PhysicsObject, obj_b: PhysicsObject) -> CollisionPair:
        """Check collision between two circles."""
        dx = obj_b.position["x"] - obj_a.position["x"]
        dy = obj_b.position["y"] - obj_a.position["y"]
        distance_sq = dx * dx + dy * dy

        radius_sum = obj_a.dimensions["radius"] + obj_b.dimensions["radius"]
        if distance_sq >= radius_sum * radius_sum:
            return None

        distance = math.sqrt(distance_sq)
        if distance == 0:
            normal = {"x": 1, "y": 0}
        else:
            normal = {"x": dx/distance, "y": dy/distance}

        return CollisionPair(
            object_a=obj_a,
            object_b=obj_b,
            contact_point={
                "x": obj_a.position["x"] + normal["x"] * obj_a.dimensions["radius"],
                "y": obj_a.position["y"] + normal["y"] * obj_a.dimensions["radius"]
            },
            normal=normal,
            penetration=radius_sum - distance
        )

    def _resolve_collisions(self, collisions: List[CollisionPair]):
        """Resolve all collisions."""
        for collision in collisions:
            self._resolve_collision(collision)

    def _resolve_collision(self, collision: CollisionPair):
        """Resolve a single collision."""
        obj_a = collision.object_a
        obj_b = collision.object_b
        normal = collision.normal

        # Calculate relative velocity
        rel_vel_x = obj_b.velocity["x"] - obj_a.velocity["x"]
        rel_vel_y = obj_b.velocity["y"] - obj_a.velocity["y"]

        # Calculate relative velocity along normal
        vel_along_normal = rel_vel_x * normal["x"] + rel_vel_y * normal["y"]

        # Don't resolve if objects are separating
        if vel_along_normal > 0:
            return

        # Calculate restitution (bounciness)
        restitution = min(obj_a.restitution, obj_b.restitution)

        # Calculate impulse scalar
        j = -(1 + restitution) * vel_along_normal
        j /= (1/obj_a.mass + 1/obj_b.mass) if not obj_a.is_static and not obj_b.is_static else \
             (1/obj_a.mass if not obj_a.is_static else 1/obj_b.mass)

        # Apply impulse
        if not obj_a.is_static:
            obj_a.velocity["x"] -= j * normal["x"] / obj_a.mass
            obj_a.velocity["y"] -= j * normal["y"] / obj_a.mass

        if not obj_b.is_static:
            obj_b.velocity["x"] += j * normal["x"] / obj_b.mass
            obj_b.velocity["y"] += j * normal["y"] / obj_b.mass

        # Positional correction (prevent sinking)
        correction_percent = 0.2  # Penetration percentage to correct
        slop = 0.01  # Penetration allowance
        correction = max(collision.penetration - slop, 0) / \
                    (1/obj_a.mass + 1/obj_b.mass if not obj_a.is_static and not obj_b.is_static else \
                     1/obj_a.mass if not obj_a.is_static else 1/obj_b.mass) * correction_percent

        if not obj_a.is_static:
            obj_a.position["x"] -= correction * normal["x"] / obj_a.mass
            obj_a.position["y"] -= correction * normal["y"] / obj_a.mass

        if not obj_b.is_static:
            obj_b.position["x"] += correction * normal["x"] / obj_b.mass
            obj_b.position["y"] += correction * normal["y"] / obj_b.mass
