from typing import Optional, Dict, Any
import json
from redis import Redis
from ..models import Scene
from ..config import Config

class CacheManager:
    def __init__(self, redis_url: str = Config.REDIS_URL):
        self.redis = Redis.from_url(redis_url)
        self.default_ttl = 3600  # 1 hour

    def cache_scene_state(self, scene_id: int, state: Dict[str, Any], ttl: int = None) -> bool:
        """Cache scene state"""
        key = f"scene:{scene_id}:state"
        try:
            self.redis.setex(
                key,
                ttl or self.default_ttl,
                json.dumps(state)
            )
            return True
        except Exception as e:
            print(f"Error caching scene state: {e}")
            return False

    def get_cached_state(self, scene_id: int) -> Optional[Dict[str, Any]]:
        """Get cached scene state"""
        key = f"scene:{scene_id}:state"
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Error getting cached state: {e}")
        return None

    def invalidate_cache(self, scene_id: int) -> bool:
        """Invalidate scene cache"""
        pattern = f"scene:{scene_id}:*"
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
            return True
        except Exception as e:
            print(f"Error invalidating cache: {e}")
            return False

    def cache_scene_render(self, scene_id: int, render_data: Dict[str, Any], ttl: int = None) -> bool:
        """Cache scene render data"""
        key = f"scene:{scene_id}:render"
        try:
            self.redis.setex(
                key,
                ttl or self.default_ttl,
                json.dumps(render_data)
            )
            return True
        except Exception as e:
            print(f"Error caching render data: {e}")
            return False

    def get_cached_render(self, scene_id: int) -> Optional[Dict[str, Any]]:
        """Get cached scene render"""
        key = f"scene:{scene_id}:render"
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Error getting cached render: {e}")
        return None

    def cache_user_preferences(self, user_id: int, preferences: Dict[str, Any], ttl: int = None) -> bool:
        """Cache user preferences"""
        key = f"user:{user_id}:preferences"
        try:
            self.redis.setex(
                key,
                ttl or self.default_ttl,
                json.dumps(preferences)
            )
            return True
        except Exception as e:
            print(f"Error caching user preferences: {e}")
            return False

    def get_cached_preferences(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached user preferences"""
        key = f"user:{user_id}:preferences"
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Error getting cached preferences: {e}")
        return None

    def clear_all_cache(self) -> bool:
        """Clear all cache (use with caution)"""
        try:
            self.redis.flushdb()
            return True
        except Exception as e:
            print(f"Error clearing cache: {e}")
            return False
