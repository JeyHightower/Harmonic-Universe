"""Caching utility functions."""

import time
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar, Union
from datetime import datetime, timedelta
from functools import wraps
import json
import hashlib
import pickle
from pathlib import Path
import threading
import logging

# Type variable for generic cache key
T = TypeVar("T")


class Cache:
    """Simple in-memory cache implementation."""

    def __init__(self, default_ttl: int = 300):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._default_ttl = default_ttl
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if expiry > time.time():
                    return value
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache with TTL."""
        expiry = time.time() + (ttl if ttl is not None else self._default_ttl)
        with self._lock:
            self._cache[key] = (value, expiry)

    def delete(self, key: str) -> bool:
        """Delete value from cache."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
        return False

    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()

    def cleanup(self) -> int:
        """Remove expired entries and return count of removed items."""
        current_time = time.time()
        removed = 0
        with self._lock:
            keys_to_delete = [
                key
                for key, (_, expiry) in self._cache.items()
                if expiry <= current_time
            ]
            for key in keys_to_delete:
                del self._cache[key]
                removed += 1
        return removed


def cache_key(*args: Any, **kwargs: Any) -> str:
    """Generate cache key from arguments."""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    key_string = "|".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def memoize(ttl: int = 300):
    """Decorator to memoize function results."""
    cache = Cache(default_ttl=ttl)

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            key = cache_key(func.__name__, *args, **kwargs)
            result = cache.get(key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(key, result)
            return result

        return wrapper

    return decorator


class FileCache:
    """File-based cache implementation."""

    def __init__(self, cache_dir: Union[str, Path], default_ttl: int = 300):
        self.cache_dir = Path(cache_dir)
        self.default_ttl = default_ttl
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for key."""
        return self.cache_dir / f"{hashlib.md5(key.encode()).hexdigest()}.cache"

    def get(self, key: str) -> Optional[Any]:
        """Get value from file cache."""
        cache_path = self._get_cache_path(key)
        if not cache_path.exists():
            return None

        try:
            with open(cache_path, "rb") as f:
                data = pickle.load(f)
                if data["expiry"] > time.time():
                    return data["value"]
                cache_path.unlink()
        except (pickle.PickleError, OSError):
            if cache_path.exists():
                cache_path.unlink()
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in file cache with TTL."""
        cache_path = self._get_cache_path(key)
        expiry = time.time() + (ttl if ttl is not None else self.default_ttl)

        try:
            with open(cache_path, "wb") as f:
                pickle.dump({"value": value, "expiry": expiry}, f)
        except (pickle.PickleError, OSError) as e:
            logging.error(f"Error setting cache value: {e}")

    def delete(self, key: str) -> bool:
        """Delete value from file cache."""
        cache_path = self._get_cache_path(key)
        try:
            if cache_path.exists():
                cache_path.unlink()
                return True
        except OSError:
            pass
        return False

    def clear(self) -> None:
        """Clear all cache files."""
        for cache_file in self.cache_dir.glob("*.cache"):
            try:
                cache_file.unlink()
            except OSError:
                pass

    def cleanup(self) -> int:
        """Remove expired cache files and return count of removed files."""
        removed = 0
        current_time = time.time()

        for cache_file in self.cache_dir.glob("*.cache"):
            try:
                with open(cache_file, "rb") as f:
                    data = pickle.load(f)
                    if data["expiry"] <= current_time:
                        cache_file.unlink()
                        removed += 1
            except (pickle.PickleError, OSError):
                if cache_file.exists():
                    cache_file.unlink()
                    removed += 1

        return removed


def cache_result(cache: Union[Cache, FileCache], ttl: Optional[int] = None):
    """Decorator to cache function results using provided cache instance."""

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            key = cache_key(func.__name__, *args, **kwargs)
            result = cache.get(key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(key, result, ttl)
            return result

        return wrapper

    return decorator
