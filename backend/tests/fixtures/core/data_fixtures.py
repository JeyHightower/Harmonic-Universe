"""Test data generation fixtures."""

import pytest
from typing import Dict, Any, Callable, List
import random
import string
import uuid
from datetime import datetime, timedelta
import json

@pytest.fixture
def generate_user_data() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates test user data."""
    def _generate(
        is_superuser: bool = False,
        is_active: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        return {
            "id": user_id,
            "email": f"user_{user_id}@example.com",
            "full_name": f"Test User {user_id}",
            "password": "".join(random.choices(string.ascii_letters + string.digits, k=12)),
            "is_active": is_active,
            "is_superuser": is_superuser,
            **kwargs
        }
    return _generate

@pytest.fixture
def generate_universe_data() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates test universe data."""
    def _generate(
        creator_id: str = None,
        is_public: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        universe_id = str(uuid.uuid4())
        return {
            "id": universe_id,
            "name": f"Universe {universe_id}",
            "description": f"Test universe description {universe_id}",
            "creator_id": creator_id or str(uuid.uuid4()),
            "is_public": is_public,
            "metadata": {
                "genre": random.choice(["fantasy", "sci-fi", "modern"]),
                "theme": random.choice(["adventure", "mystery", "drama"]),
                "tags": [f"tag_{i}" for i in range(3)]
            },
            **kwargs
        }
    return _generate

@pytest.fixture
def generate_scene_data() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates test scene data."""
    def _generate(
        universe_id: str = None,
        rendering_mode: str = "3D",
        **kwargs
    ) -> Dict[str, Any]:
        scene_id = str(uuid.uuid4())
        return {
            "id": scene_id,
            "name": f"Scene {scene_id}",
            "description": f"Test scene description {scene_id}",
            "universe_id": universe_id or str(uuid.uuid4()),
            "rendering_mode": rendering_mode,
            "physics_enabled": True,
            "music_enabled": True,
            "metadata": {
                "environment": random.choice(["space", "forest", "city"]),
                "time_of_day": random.choice(["day", "night", "dusk"]),
                "weather": random.choice(["clear", "rain", "snow"])
            },
            **kwargs
        }
    return _generate

@pytest.fixture
def generate_test_data() -> Callable[..., Dict[str, Any]]:
    """Get a function that generates a complete test dataset."""
    def _generate(num_users: int = 3, num_universes: int = 2, num_scenes: int = 2) -> Dict[str, Any]:
        users = []
        universes = []
        scenes = []

        # Generate users
        for i in range(num_users):
            user_id = str(uuid.uuid4())
            users.append({
                "id": user_id,
                "email": f"user_{i}@example.com",
                "full_name": f"Test User {i}",
                "is_active": True,
                "is_superuser": i == 0  # First user is superuser
            })

        # Generate universes
        for i in range(num_universes):
            universe_id = str(uuid.uuid4())
            creator = random.choice(users)
            universes.append({
                "id": universe_id,
                "name": f"Universe {i}",
                "description": f"Test Universe {i}",
                "creator_id": creator["id"],
                "is_public": bool(random.getrandbits(1))
            })

            # Generate scenes for each universe
            for j in range(num_scenes):
                scene_id = str(uuid.uuid4())
                scenes.append({
                    "id": scene_id,
                    "name": f"Scene {j} in Universe {i}",
                    "description": f"Test Scene {j}",
                    "universe_id": universe_id,
                    "rendering_mode": random.choice(["2D", "3D"]),
                    "physics_enabled": bool(random.getrandbits(1)),
                    "music_enabled": bool(random.getrandbits(1))
                })

        return {
            "users": users,
            "universes": universes,
            "scenes": scenes,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "total_users": len(users),
                "total_universes": len(universes),
                "total_scenes": len(scenes)
            }
        }
    return _generate
