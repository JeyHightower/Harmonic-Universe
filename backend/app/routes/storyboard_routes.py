from flask import Blueprint, jsonify, request, g, current_app
from app.models.storyboard import Storyboard
from app.models.universe import Universe
from app.models.version import Version
from app import db, cache
from app.utils.token_manager import auto_token
from app.utils.decorators import handle_exceptions, validate_json
from werkzeug.exceptions import NotFound, BadRequest, Unauthorized, Forbidden
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import or_, and_
from datetime import datetime, timedelta

storyboard_bp = Blueprint('storyboard', __name__)

def validate_storyboard_data(data):
    """Validate storyboard input data with enhanced checks"""
    if not isinstance(data, dict):
        raise BadRequest('Invalid data format: expected JSON object')

    if not data:
        raise BadRequest('Missing required fields: plot_point, description, harmony_tie')

    required_fields = ['plot_point', 'description', 'harmony_tie']
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise BadRequest(f'Missing required fields: {", ".join(missing_fields)}')

    # Enhanced validation for plot_point
    if not isinstance(data['plot_point'], str):
        raise BadRequest('plot_point must be a string')
    if len(data['plot_point'].strip()) < 1:
        raise BadRequest('plot_point must be a non-empty string')
    if len(data['plot_point']) > 500:
        raise BadRequest('plot_point cannot exceed 500 characters')

    # Enhanced validation for description
    if not isinstance(data['description'], str):
        raise BadRequest('description must be a string')
    if len(data['description'].strip()) < 1:
        raise BadRequest('description cannot be empty')
    if len(data['description']) > 2000:
        raise BadRequest('description cannot exceed 2000 characters')

    # Enhanced validation for harmony_tie
    if not isinstance(data['harmony_tie'], (int, float)):
        raise BadRequest('harmony_tie must be a number')
    if not 0 <= data['harmony_tie'] <= 1:
        raise BadRequest('harmony_tie must be a number between 0 and 1')

    # Strip whitespace from string fields
    data['plot_point'] = data['plot_point'].strip()
    data['description'] = data['description'].strip()

    return data

def get_universe_or_404(universe_id, check_auth=True):
    """Get universe and check authorization"""
    cache_key = f'universe_{universe_id}'
    universe = cache.get(cache_key)

    if not universe:
        universe = Universe.query.get_or_404(universe_id, description='Universe not found')
        cache.set(cache_key, universe, timeout=300)  # Cache for 5 minutes

    if check_auth and universe.creator_id != g.current_user.id:
        raise Forbidden('You do not have permission to access this universe')
    return universe

def get_storyboard_cache_key(universe_id, **params):
    """Generate cache key for storyboard queries"""
    return f'storyboards_{universe_id}_{hash(frozenset(params.items()))}'

@storyboard_bp.route('/', methods=['POST'])
@auto_token
@validate_json
@handle_exceptions
def add_storyboard(universe_id):
    data = validate_storyboard_data(request.get_json())
    universe = get_universe_or_404(universe_id)

    try:
        new_storyboard = Storyboard(
            universe_id=universe_id,
            plot_point=data['plot_point'],
            description=data['description'],
            harmony_tie=data['harmony_tie']
        )
        db.session.add(new_storyboard)
        db.session.commit()

        # Create initial version
        new_storyboard.create_version(
            description='Initial version',
            created_by=g.current_user.id
        )

        # Invalidate cache
        cache.delete_pattern(f'storyboards_{universe_id}_*')

        return jsonify({
            'message': 'Storyboard created successfully',
            'storyboard': new_storyboard.to_dict()
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f'Database error: {str(e)}')
        raise BadRequest(f'Database error: {str(e)}')

@storyboard_bp.route('/', methods=['GET'])
@auto_token
@handle_exceptions
def get_storyboards(universe_id):
    universe = get_universe_or_404(universe_id)

    # Get and validate query parameters
    page = max(1, request.args.get('page', 1, type=int))
    per_page = min(100, max(1, request.args.get('per_page', 10, type=int)))
    sort_by = request.args.get('sort_by', 'created_at')
    order = request.args.get('order', 'desc').lower()
    harmony_min = request.args.get('harmony_min', type=float)
    harmony_max = request.args.get('harmony_max', type=float)
    search_query = request.args.get('search', '').strip()

    # Validate parameters
    if harmony_min is not None and (harmony_min < 0 or harmony_min > 1):
        raise BadRequest('harmony_min must be between 0 and 1')
    if harmony_max is not None and (harmony_max < 0 or harmony_max > 1):
        raise BadRequest('harmony_max must be between 0 and 1')
    if harmony_min is not None and harmony_max is not None and harmony_min > harmony_max:
        raise BadRequest('harmony_min cannot be greater than harmony_max')

    valid_sort_fields = ['created_at', 'updated_at', 'harmony_tie', 'plot_point']
    if sort_by not in valid_sort_fields:
        raise BadRequest(f'Invalid sort field. Must be one of: {", ".join(valid_sort_fields)}')
    if order not in ['asc', 'desc']:
        raise BadRequest('Invalid sort order. Must be "asc" or "desc"')

    # Generate cache key
    cache_key = get_storyboard_cache_key(
        universe_id,
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        order=order,
        harmony_min=harmony_min,
        harmony_max=harmony_max,
        search=search_query
    )

    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify(cached_result), 200

    try:
        # Build optimized query
        query = Storyboard.query.filter_by(universe_id=universe_id)

        # Apply filters
        filters = []
        if search_query:
            search = f"%{search_query}%"
            filters.append(or_(
                Storyboard.plot_point.ilike(search),
                Storyboard.description.ilike(search)
            ))
        if harmony_min is not None:
            filters.append(Storyboard.harmony_tie >= harmony_min)
        if harmony_max is not None:
            filters.append(Storyboard.harmony_tie <= harmony_max)

        if filters:
            query = query.filter(and_(*filters))

        # Apply sorting
        sort_column = getattr(Storyboard, sort_by)
        query = query.order_by(sort_column.desc() if order == 'desc' else sort_column)

        # Execute query with pagination
        paginated = query.paginate(page=page, per_page=per_page)

        result = {
            'storyboards': [s.to_dict() for s in paginated.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': paginated.total,
                'total_pages': paginated.pages
            },
            'sort': {
                'field': sort_by,
                'order': order
            },
            'filters': {
                'search': search_query,
                'harmony_min': harmony_min,
                'harmony_max': harmony_max
            }
        }

        # Cache the result
        cache.set(cache_key, result, timeout=60)  # Cache for 1 minute
        return jsonify(result), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f'Database error: {str(e)}')
        raise BadRequest(f'Database error: {str(e)}')

@storyboard_bp.route('/<int:storyboard_id>', methods=['PUT'])
@auto_token
@validate_json
@handle_exceptions
def update_storyboard(universe_id, storyboard_id):
    data = validate_storyboard_data(request.get_json())
    universe = get_universe_or_404(universe_id)

    try:
        storyboard = Storyboard.query.get_or_404(storyboard_id)
        if storyboard.universe_id != universe_id:
            raise NotFound('Storyboard not found in this universe')

        # Create a version before updating
        storyboard.create_version(
            description=data.get('version_description', 'Update'),
            created_by=g.current_user.id
        )

        # Update fields
        storyboard.plot_point = data['plot_point']
        storyboard.description = data['description']
        storyboard.harmony_tie = data['harmony_tie']
        storyboard.updated_at = datetime.utcnow()

        db.session.commit()

        # Invalidate cache
        cache.delete_pattern(f'storyboards_{universe_id}_*')

        return jsonify({
            'message': 'Storyboard updated successfully',
            'storyboard': storyboard.to_dict()
        }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f'Database error: {str(e)}')
        raise BadRequest(f'Database error: {str(e)}')

@storyboard_bp.route('/<int:storyboard_id>', methods=['DELETE'])
@auto_token
def delete_storyboard(universe_id, storyboard_id):
    try:
        universe = get_universe_or_404(universe_id)
        storyboard = Storyboard.query.get_or_404(storyboard_id, description='Storyboard not found')

        if storyboard.universe_id != universe_id:
            raise NotFound('Storyboard not found in this universe')

        # Start database transaction
        try:
            db.session.delete(storyboard)
            db.session.commit()
            return jsonify({
                'message': 'Storyboard deleted successfully',
                'deleted_storyboard': {
                    'id': storyboard_id,
                    'universe_id': universe_id
                }
            }), 200

        except SQLAlchemyError as e:
            db.session.rollback()
            raise BadRequest(f'Database error: {str(e)}')

    except BadRequest as e:
        return jsonify({'error': str(e), 'type': 'validation_error'}), 400
    except NotFound as e:
        return jsonify({'error': str(e), 'type': 'not_found_error'}), 404
    except Forbidden as e:
        return jsonify({'error': str(e), 'type': 'authorization_error'}), 403
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An unexpected error occurred',
            'type': 'server_error',
            'details': str(e)
        }), 500

@storyboard_bp.route('/<int:storyboard_id>/versions', methods=['GET'])
@auto_token
@handle_exceptions
def get_versions(universe_id, storyboard_id):
    """Get version history for a storyboard."""
    universe = get_universe_or_404(universe_id)
    storyboard = Storyboard.query.get_or_404(storyboard_id)

    if storyboard.universe_id != universe_id:
        raise NotFound('Storyboard not found in this universe')

    limit = min(50, request.args.get('limit', 10, type=int))
    versions = storyboard.get_recent_versions(limit)

    return jsonify({
        'versions': [version.to_dict() for version in versions]
    }), 200

@storyboard_bp.route('/<int:storyboard_id>/versions/<int:version_id>/restore', methods=['POST'])
@auto_token
@handle_exceptions
def restore_version(universe_id, storyboard_id, version_id):
    """Restore a storyboard to a previous version."""
    universe = get_universe_or_404(universe_id)
    storyboard = Storyboard.query.get_or_404(storyboard_id)

    if storyboard.universe_id != universe_id:
        raise NotFound('Storyboard not found in this universe')

    try:
        # Create a new version before restoring
        storyboard.create_version(
            description=f'Backup before restoring to version {version_id}',
            created_by=g.current_user.id
        )

        # Restore the specified version
        storyboard.restore_version(version_id)

        # Create a new version to mark the restoration
        storyboard.create_version(
            description=f'Restored from version {version_id}',
            created_by=g.current_user.id
        )

        # Invalidate cache
        cache.delete_pattern(f'storyboards_{universe_id}_*')

        return jsonify({
            'message': 'Version restored successfully',
            'storyboard': storyboard.to_dict()
        }), 200

    except ValueError as e:
        raise BadRequest(str(e))
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f'Database error: {str(e)}')
        raise BadRequest(f'Database error: {str(e)}')
