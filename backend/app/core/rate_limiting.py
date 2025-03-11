"""Rate limiting system for API protection."""

from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import time
import threading
from dataclasses import dataclass
from redis import Redis
from functools import wraps
from .logging import get_logger
from .error_handling import error_handler, ErrorCategory, ErrorSeverity

logger = get_logger(__name__)


@dataclass
class RateLimit:
    """Rate limit configuration."""

    requests: int
    period: int  # seconds
    by_user: bool = True
    by_ip: bool = True


class RateLimiter:
    """Rate limiting implementation."""

    def __init__(self, redis_client: Optional[Redis] = None):
        """Initialize rate limiter."""
        self.redis = redis_client
        self._local_cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _get_cache_key(self, endpoint: str, identifier: str, limit_type: str) -> str:
        """Generate cache key for rate limiting."""
        return f"ratelimit:{endpoint}:{limit_type}:{identifier}"

    def _get_local_window(self, cache_key: str, window_size: int) -> Tuple[int, float]:
        """Get request count and window expiry from local cache."""
        with self._lock:
            now = time.time()
            window = self._local_cache.get(cache_key)

            if window is None or window["expires"] <= now:
                window = {"count": 0, "expires": now + window_size}
                self._local_cache[cache_key] = window

            return window["count"], window["expires"]

    def _increment_local(self, cache_key: str) -> None:
        """Increment request count in local cache."""
        with self._lock:
            if cache_key in self._local_cache:
                self._local_cache[cache_key]["count"] += 1

    def check_rate_limit(
        self,
        endpoint: str,
        limit: RateLimit,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[bool, Dict[str, Any]]:
        """Check if request is within rate limits."""
        now = time.time()
        identifiers = []

        if limit.by_user and user_id:
            identifiers.append(("user", user_id))
        if limit.by_ip and ip_address:
            identifiers.append(("ip", ip_address))

        for id_type, identifier in identifiers:
            cache_key = self._get_cache_key(endpoint, identifier, id_type)

            if self.redis:
                # Use Redis for distributed rate limiting
                pipe = self.redis.pipeline()
                pipe.incr(cache_key)
                pipe.expire(cache_key, limit.period)
                current_count = pipe.execute()[0]

                if current_count > limit.requests:
                    ttl = self.redis.ttl(cache_key)
                    return False, {
                        "limit": limit.requests,
                        "remaining": 0,
                        "reset": int(now + ttl),
                        "type": id_type,
                    }

            else:
                # Use local cache for single-instance rate limiting
                count, expires = self._get_local_window(cache_key, limit.period)

                if count >= limit.requests:
                    return False, {
                        "limit": limit.requests,
                        "remaining": 0,
                        "reset": int(expires),
                        "type": id_type,
                    }

                self._increment_local(cache_key)

        # Request is within limits
        return True, {
            "limit": limit.requests,
            "remaining": limit.requests - 1,
            "reset": int(now + limit.period),
            "type": "none",
        }


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""

    pass


# Register rate limit error
error_handler.register_error(
    RateLimitExceeded,
    "RATE_LIMIT_EXCEEDED",
    ErrorSeverity.WARNING,
    ErrorCategory.SYSTEM,
    "Rate limit exceeded. Please try again later.",
)


def rate_limit(requests: int, period: int, by_user: bool = True, by_ip: bool = True):
    """Decorator for rate limiting endpoints."""

    def decorator(f):
        @wraps(f)
        def wrapped_f(*args, **kwargs):
            # This would be implemented in the web framework context
            # to get actual request data
            endpoint = f.__name__
            user_id = kwargs.get("user_id")
            ip_address = kwargs.get("ip_address")

            limit = RateLimit(
                requests=requests, period=period, by_user=by_user, by_ip=by_ip
            )

            allowed, info = rate_limiter.check_rate_limit(
                endpoint, limit, user_id, ip_address
            )

            if not allowed:
                raise RateLimitExceeded(
                    f"Rate limit of {requests} requests per {period}s exceeded"
                )

            return f(*args, **kwargs)

        return wrapped_f

    return decorator


# Global rate limiter instance
rate_limiter = RateLimiter()

__all__ = ["rate_limiter", "rate_limit", "RateLimit", "RateLimitExceeded"]
