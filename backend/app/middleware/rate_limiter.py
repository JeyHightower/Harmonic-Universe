from functools import wraps
from flask import request, jsonify, current_app
from redis import Redis
import time

class RateLimiter:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.default_limit = 100  # requests
        self.default_window = 60  # seconds

    def limit(self, key_prefix: str = None, limit: int = None, window: int = None):
        """Rate limiting decorator."""
        def decorator(f):
            @wraps(f)
            def wrapped(*args, **kwargs):
                # Get client identifier (IP or user ID)
                identifier = request.headers.get('X-Forwarded-For', request.remote_addr)
                if hasattr(request, 'user') and request.user:
                    identifier = f"user:{request.user.id}"

                # Build rate limit key
                endpoint = key_prefix or request.endpoint
                key = f"rate_limit:{endpoint}:{identifier}"

                # Get current window
                now = int(time.time())
                window_size = window or self.default_window
                window_key = f"{key}:{now // window_size}"

                # Increment request count
                current = self.redis.incr(window_key)

                # Set expiry if this is the first request in the window
                if current == 1:
                    self.redis.expire(window_key, window_size)

                # Check if limit exceeded
                rate_limit = limit or self.default_limit
                if current > rate_limit:
                    response = jsonify({
                        'error': 'Rate limit exceeded',
                        'retry_after': window_size - (now % window_size)
                    })
                    response.status_code = 429

                    # Add rate limit headers
                    response.headers['X-RateLimit-Limit'] = str(rate_limit)
                    response.headers['X-RateLimit-Remaining'] = '0'
                    response.headers['X-RateLimit-Reset'] = str(now + (window_size - (now % window_size)))
                    response.headers['Retry-After'] = str(window_size - (now % window_size))

                    return response

                # Add rate limit headers to successful response
                response = current_app.make_response(f(*args, **kwargs))
                response.headers['X-RateLimit-Limit'] = str(rate_limit)
                response.headers['X-RateLimit-Remaining'] = str(max(0, rate_limit - current))
                response.headers['X-RateLimit-Reset'] = str(now + (window_size - (now % window_size)))

                return response
            return wrapped
        return decorator

    def get_limit_for_endpoint(self, endpoint: str) -> tuple:
        """Get rate limit configuration for endpoint."""
        # You can customize limits per endpoint
        limits = {
            'get_notifications': (200, 60),    # 200 requests per minute
            'create_notification': (50, 60),   # 50 requests per minute
            'mark_as_read': (100, 60),        # 100 requests per minute
            'delete_notification': (30, 60),   # 30 requests per minute
        }
        return limits.get(endpoint, (self.default_limit, self.default_window))

rate_limiter = RateLimiter(Redis(host='localhost', port=6379, db=0))
