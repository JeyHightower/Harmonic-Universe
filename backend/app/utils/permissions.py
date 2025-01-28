from functools import wraps
from flask import current_app, request
from flask_jwt_extended import get_jwt_identity
from ..models.user import User
from ..models.universe import Universe

def permission_required(*permissions):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return {"error": "User not found"}, 404

            # Check if user has required permissions
            if not all(has_permission(user, perm) for perm in permissions):
                return {"error": "Insufficient permissions"}, 403

            return f(*args, **kwargs)
        return wrapped
    return decorator

def universe_permission_required(permission):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_id = get_jwt_identity()
            universe_id = kwargs.get('universe_id') or request.view_args.get('universe_id')

            if not universe_id:
                return {"error": "Universe ID required"}, 400

            universe = Universe.query.get(universe_id)
            if not universe:
                return {"error": "Universe not found"}, 404

            if not has_universe_permission(user_id, universe_id, permission):
                return {"error": "Insufficient permissions"}, 403

            return f(*args, **kwargs)
        return wrapped
    return decorator

def has_permission(user, permission):
    """Check if user has a specific permission."""
    if user.is_admin:
        return True

    permission_map = {
        'create_universe': lambda u: True,
        'delete_universe': lambda u: u.is_active,
        'manage_users': lambda u: u.is_admin,
        'view_analytics': lambda u: u.is_admin,
    }

    checker = permission_map.get(permission)
    return checker and checker(user)

def has_universe_permission(user_id, universe_id, permission):
    """Check if user has permission for a specific universe."""
    universe = Universe.query.get(universe_id)
    if not universe:
        return False

    # Owner has all permissions
    if universe.owner_id == user_id:
        return True

    # Public universes can be viewed by anyone
    if permission == 'view' and universe.is_public:
        return True

    # Check collaborator permissions
    collaborator = next(
        (c for c in universe.collaborators if c.user_id == user_id),
        None
    )

    if not collaborator:
        return False

    permission_levels = {
        'viewer': ['view'],
        'editor': ['view', 'edit', 'comment'],
        'admin': ['view', 'edit', 'comment', 'manage']
    }

    return permission in permission_levels.get(collaborator.role, [])
