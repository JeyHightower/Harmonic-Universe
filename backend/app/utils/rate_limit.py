from flask import request, current_app
from functools import wraps
import time
from redis import Redis
from .. import cache

redis_client = Redis(host='localhost', port=6379, db=0)

def rate_limit(limit=100, per=60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr
            # Create a unique key for this route
            key = f"rate_limit:{client_ip}:{request.endpoint}"

            try:
                # Get current count
                count = redis_client.get(key)
                count = int(count) if count else 0

                if count >= limit:
                    return {"error": "Rate limit exceeded"}, 429

                # Increment count and set expiry
                pipe = redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, per)
                pipe.execute()

                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Rate limiting error: {str(e)}")
                # Fail open if Redis is down
                return f(*args, **kwargs)
        return wrapped
    return decorator

def cache_response(timeout=300):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{f.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            response = cache.get(cache_key)
            if response:
                return response

            # If not in cache, call function and cache result
            response = f(*args, **kwargs)
            cache.set(cache_key, response, timeout=timeout)
            return response
        return wrapped
    return decorator
