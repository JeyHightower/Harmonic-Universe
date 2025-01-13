from flask import Blueprint, jsonify, request, g
from app.models.storyboard import Storyboard
from app.models.universe import Universe
from app import db
from app.utils.token_manager import auto_token
from werkzeug.exceptions import NotFound, BadRequest, Unauthorized, Forbidden
from sqlalchemy.exc import SQLAlchemyError

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
    universe = Universe.query.get_or_404(universe_id, description='Universe not found')
    if check_auth and universe.creator_id != g.current_user.id:
        raise Forbidden('You do not have permission to access this universe')
    return universe

@storyboard_bp.route('/', methods=['POST'])
@auto_token
def add_storyboard(universe_id):
    try:
        data = request.get_json()
        if not data:
            raise BadRequest('Missing required fields: plot_point, description, harmony_tie')

        # Validate and sanitize input data
        data = validate_storyboard_data(data)
        universe = get_universe_or_404(universe_id)

        # Start database transaction
        try:
            new_storyboard = Storyboard(
                universe_id=universe_id,
                plot_point=data['plot_point'],
                description=data['description'],
                harmony_tie=data['harmony_tie']
            )
            db.session.add(new_storyboard)
            db.session.commit()

            return jsonify({
                'message': 'Storyboard created successfully',
                'storyboard': {
                    'id': new_storyboard.id,
                    'plot_point': new_storyboard.plot_point,
                    'description': new_storyboard.description,
                    'harmony_tie': new_storyboard.harmony_tie,
                    'created_at': new_storyboard.created_at.isoformat() if hasattr(new_storyboard, 'created_at') else None,
                    'updated_at': new_storyboard.updated_at.isoformat() if hasattr(new_storyboard, 'updated_at') else None,
                    'universe_id': new_storyboard.universe_id
                }
            }), 201

        except SQLAlchemyError as e:
            db.session.rollback()
            raise BadRequest(f'Database error: {str(e)}')

    except BadRequest as e:
        return jsonify({'error': str(e), 'type': 'validation_error'}), 400
    except Forbidden as e:
        return jsonify({'error': str(e), 'type': 'authorization_error'}), 403
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'An unexpected error occurred',
            'type': 'server_error',
            'details': str(e)
        }), 500

@storyboard_bp.route('/', methods=['GET'])
@auto_token
def get_storyboards(universe_id):
    try:
        universe = get_universe_or_404(universe_id)

        # Get query parameters for filtering and pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')
        harmony_min = request.args.get('harmony_min', type=float)
        harmony_max = request.args.get('harmony_max', type=float)

        # Validate pagination parameters
        if page < 1:
            raise BadRequest('Page number must be greater than 0')
        if per_page < 1 or per_page > 100:
            raise BadRequest('Items per page must be between 1 and 100')

        # Validate harmony range
        if harmony_min is not None and (harmony_min < 0 or harmony_min > 1):
            raise BadRequest('harmony_min must be between 0 and 1')
        if harmony_max is not None and (harmony_max < 0 or harmony_max > 1):
            raise BadRequest('harmony_max must be between 0 and 1')
        if harmony_min is not None and harmony_max is not None and harmony_min > harmony_max:
            raise BadRequest('harmony_min cannot be greater than harmony_max')

        # Validate sort parameters
        valid_sort_fields = ['created_at', 'updated_at', 'harmony_tie', 'plot_point']
        if sort_by not in valid_sort_fields:
            raise BadRequest(f'Invalid sort field. Must be one of: {", ".join(valid_sort_fields)}')
        if order.lower() not in ['asc', 'desc']:
            raise BadRequest('Invalid sort order. Must be "asc" or "desc"')

        try:
            # Build query
            query = Storyboard.query.filter_by(universe_id=universe_id)

            # Apply harmony tie filters if provided
            if harmony_min is not None:
                query = query.filter(Storyboard.harmony_tie >= harmony_min)
            if harmony_max is not None:
                query = query.filter(Storyboard.harmony_tie <= harmony_max)

            # Apply sorting
            sort_column = getattr(Storyboard, sort_by)
            if order.lower() == 'desc':
                sort_column = sort_column.desc()
            query = query.order_by(sort_column)

            # Execute paginated query
            paginated_storyboards = query.paginate(page=page, per_page=per_page)

            # Format response
            storyboards = [{
                'id': s.id,
                'plot_point': s.plot_point,
                'description': s.description,
                'harmony_tie': s.harmony_tie,
                'created_at': s.created_at.isoformat() if hasattr(s, 'created_at') else None,
                'updated_at': s.updated_at.isoformat() if hasattr(s, 'updated_at') else None,
                'universe_id': s.universe_id
            } for s in paginated_storyboards.items]

            return jsonify({
                'storyboards': storyboards,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_pages': paginated_storyboards.pages,
                    'total_items': paginated_storyboards.total
                },
                'filters': {
                    'harmony_min': harmony_min,
                    'harmony_max': harmony_max,
                    'sort_by': sort_by,
                    'order': order
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
        return jsonify({
            'error': 'An unexpected error occurred',
            'type': 'server_error',
            'details': str(e)
        }), 500

@storyboard_bp.route('/<int:storyboard_id>', methods=['PUT'])
@auto_token
def update_storyboard(universe_id, storyboard_id):
    try:
        data = request.get_json()
        if not data:
            raise BadRequest('No JSON data provided')

        # Validate and sanitize input data
        data = validate_storyboard_data(data)
        universe = get_universe_or_404(universe_id)

        # Get storyboard and verify ownership
        storyboard = Storyboard.query.get_or_404(storyboard_id, description='Storyboard not found')
        if storyboard.universe_id != universe_id:
            raise NotFound('Storyboard not found in this universe')

        # Start database transaction
        try:
            # Update storyboard fields
            storyboard.plot_point = data['plot_point']
            storyboard.description = data['description']
            storyboard.harmony_tie = data['harmony_tie']
            db.session.commit()

            return jsonify({
                'message': 'Storyboard updated successfully',
                'storyboard': {
                    'id': storyboard.id,
                    'plot_point': storyboard.plot_point,
                    'description': storyboard.description,
                    'harmony_tie': storyboard.harmony_tie,
                    'created_at': storyboard.created_at.isoformat() if hasattr(storyboard, 'created_at') else None,
                    'updated_at': storyboard.updated_at.isoformat() if hasattr(storyboard, 'updated_at') else None,
                    'universe_id': storyboard.universe_id
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
