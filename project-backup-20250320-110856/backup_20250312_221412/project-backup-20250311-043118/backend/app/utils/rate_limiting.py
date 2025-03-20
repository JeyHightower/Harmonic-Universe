"""Rate limiting utility functions."""

import time
from typing import Dict, Optional, Tuple, Union
from datetime import datetime
import threading
from functools import wraps
from dataclasses import dataclass
import logging
from collections import defaultdict


@dataclass
class RateLimit:
    """Rate limit configuration."""

    requests: int
    period: int  # in seconds
    block_duration: Optional[int] = None  # in seconds


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded."""

    def __init__(self, limit: RateLimit, reset_time: float):
        self.limit = limit
        self.reset_time = reset_time
        super().__init__(
            f"Rate limit exceeded. Try again in {reset_time - time.time():.1f} seconds"
        )


class RateLimiter:
    """Rate limiter implementation."""

    def __init__(self):
        self._requests: Dict[str, list] = defaultdict(list)
        self._blocked_until: Dict[str, float] = {}
        self._lock = threading.Lock()

    def is_allowed(self, key: str, limit: RateLimit) -> Tuple[bool, Optional[float]]:
        """Check if request is allowed under rate limit."""
        with self._lock:
            now = time.time()

            # Check if key is blocked
            if key in self._blocked_until:
                if now < self._blocked_until[key]:
                    return False, self._blocked_until[key]
                del self._blocked_until[key]

            # Clean old requests
            self._requests[key] = [
                ts for ts in self._requests[key] if ts > now - limit.period
            ]

            # Check rate limit
            if len(self._requests[key]) >= limit.requests:
                if limit.block_duration:
                    self._blocked_until[key] = now + limit.block_duration
                    return False, now + limit.block_duration
                return False, self._requests[key][0] + limit.period

            # Add new request
            self._requests[key].append(now)
            return True, None

    def reset(self, key: str) -> None:
        """Reset rate limit for key."""
        with self._lock:
            if key in self._requests:
                del self._requests[key]
            if key in self._blocked_until:
                del self._blocked_until[key]


class TokenBucket:
    """Token bucket rate limiter implementation."""

    def __init__(self, capacity: int, fill_rate: float):
        """
        Initialize token bucket.

        Args:
            capacity: Maximum number of tokens
            fill_rate: Tokens per second
        """
        self.capacity = capacity
        self.fill_rate = fill_rate
        self.tokens = capacity
        self.last_update = time.time()
        self._lock = threading.Lock()

    def consume(self, tokens: int = 1) -> bool:
        """
        Consume tokens from bucket.

        Args:
            tokens: Number of tokens to consume

        Returns:
            bool: True if tokens were consumed, False if not enough tokens
        """
        with self._lock:
            now = time.time()
            # Add new tokens based on time passed
            time_passed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + time_passed * self.fill_rate)
            self.last_update = now

            if tokens <= self.tokens:
                self.tokens -= tokens
                return True
            return False


class SlidingWindowRateLimiter:
    """Sliding window rate limiter implementation."""

    def __init__(self):
        self._windows: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
        self._lock = threading.Lock()

    def is_allowed(self, key: str, limit: RateLimit) -> Tuple[bool, Optional[float]]:
        """Check if request is allowed under rate limit."""
        with self._lock:
            now = int(time.time())
            window_start = now - limit.period

            # Clean old windows
            if key in self._windows:
                self._windows[key] = {
                    ts: count
                    for ts, count in self._windows[key].items()
                    if ts > window_start
                }

            # Calculate current request count
            total_requests = sum(self._windows[key].values())

            if total_requests >= limit.requests:
                # Find reset time
                oldest_timestamp = (
                    min(self._windows[key].keys()) if self._windows[key] else now
                )
                return False, oldest_timestamp + limit.period

            # Add new request
            self._windows[key][now] += 1
            return True, None

    def reset(self, key: str) -> None:
        """Reset rate limit for key."""
        with self._lock:
            if key in self._windows:
                del self._windows[key]


def rate_limit(limit: RateLimit, key_func: Optional[callable] = None):
    """
    Decorator for rate limiting.

    Args:
        limit: Rate limit configuration
        key_func: Function to generate rate limit key from function arguments
    """
    limiter = RateLimiter()

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                key = func.__name__

            # Check rate limit
            allowed, reset_time = limiter.is_allowed(key, limit)
            if not allowed:
                raise RateLimitExceeded(limit, reset_time)

            return func(*args, **kwargs)

        return wrapper

    return decorator


def ip_rate_limit(requests: int, period: int, block_duration: Optional[int] = None):
    """
    Decorator for IP-based rate limiting.

    Args:
        requests: Number of requests allowed
        period: Time period in seconds
        block_duration: Optional blocking duration in seconds
    """
    limit = RateLimit(requests=requests, period=period, block_duration=block_duration)

    def key_func(request, *args, **kwargs):
        return request.remote_addr

    return rate_limit(limit, key_func)
