from functools import wraps
from flask import jsonify, request, current_app
from werkzeug.exceptions import BadRequest, NotFound, Forbidden, HTTPException
from sqlalchemy.exc import SQLAlchemyError

def handle_exceptions(f):
    """Global exception handler for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except BadRequest as e:
            return jsonify({
                'error': str(e),
                'type': 'validation_error'
            }), 400
        except NotFound as e:
            return jsonify({
                'error': str(e),
                'type': 'not_found_error'
            }), 404
        except Forbidden as e:
            return jsonify({
                'error': str(e),
                'type': 'authorization_error'
            }), 403
        except SQLAlchemyError as e:
            current_app.logger.error(f'Database error: {str(e)}')
            return jsonify({
                'error': 'A database error occurred',
                'type': 'database_error',
                'details': str(e) if current_app.debug else None
            }), 500
        except HTTPException as e:
            return jsonify({
                'error': str(e),
                'type': 'http_error'
            }), e.code
        except Exception as e:
            current_app.logger.error(f'Unexpected error: {str(e)}')
            return jsonify({
                'error': 'An unexpected error occurred',
                'type': 'server_error',
                'details': str(e) if current_app.debug else None
            }), 500
    return decorated_function

def validate_json(f):
    """Validate that the request contains JSON data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            raise BadRequest('Content-Type must be application/json')
        if not request.get_json():
            raise BadRequest('No JSON data provided')
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(requests_per_minute=60):
    """Rate limit decorator using Redis"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from app import cache

            # Get client identifier (IP or user ID)
            client_id = request.remote_addr

            # Create rate limit key
            key = f'rate_limit:{client_id}:{request.endpoint}'

            # Get current request count
            request_count = cache.get(key) or 0

            if request_count >= requests_per_minute:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'type': 'rate_limit_error'
                }), 429

            # Increment request count
            pipe = cache.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)  # Reset after 1 minute
            pipe.execute()

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def cache_response(timeout=300):
    """Cache response decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from app import cache

            # Create cache key from request data
            cache_key = f'response_cache:{request.endpoint}:{hash(frozenset(request.args.items()))}'

            # Try to get from cache
            response = cache.get(cache_key)
            if response is not None:
                return response

            # Generate response
            response = f(*args, **kwargs)

            # Cache response
            cache.set(cache_key, response, timeout=timeout)

            return response
        return decorated_function
    return decorator
