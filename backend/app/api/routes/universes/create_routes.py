from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...models.universe import Universe
from ...models.user import User
from ....extensions import db
from ....utils.decorators import get_demo_user_email
from app.utils.decorators import jwt_required_or_demo

from . import universes_bp

@universes_bp.route('/', methods=['POST'])
@jwt_required_or_demo
def create_universe():
    try:
        data = request.get_json()
        if not data:
            current_app.logger.warning('Create universe attempt with no data')
            return jsonify({
                'message': 'No data provided',
                'error': 'Request body is required'
            }), 400

        # Check if this is a demo user request
        is_demo_user = request.headers.get('X-Demo-User') == 'true'
        demo_user_email = get_demo_user_email() if is_demo_user else None

        # Get user identity from JWT (for regular users)
        user_id = None
        if not is_demo_user:
            user_id = get_jwt_identity()
        else:
            # For demo users, get the demo user ID
            demo_user = User.query.filter_by(email=demo_user_email).first()
            if not demo_user:
                current_app.logger.warning(f'Demo user {demo_user_email} not found')
                return jsonify({
                    'message': 'Demo user not found',
                    'error': 'Invalid demo user'
                }), 404
            user_id = demo_user.id

        current_app.logger.info(f'Creating universe for {"demo" if is_demo_user else "regular"} user {user_id}')

        # Validate required fields
        name = data.get('name', '').strip()
        if not name:
            current_app.logger.warning(f'Create universe attempt with empty name by user {user_id}')
            return jsonify({
                'message': 'Name is required',
                'error': 'Universe name cannot be empty'
            }), 400

        if len(name) > 100:
            current_app.logger.warning(f'Create universe attempt with too long name by user {user_id}')
            return jsonify({
                'message': 'Name is too long',
                'error': 'Universe name cannot exceed 100 characters'
            }), 400

        # Create new universe with validated data
        universe = Universe(
            name=name,
            description=data.get('description', '').strip(),
            is_public=data.get('is_public', False),
            user_id=user_id
        )

        # Validate the universe object
        try:
            universe.validate()
        except ValueError as ve:
            current_app.logger.warning(f'Universe validation error for user {user_id}: {str(ve)}')
            return jsonify({
                'message': 'Validation error',
                'error': str(ve)
            }), 400

        db.session.add(universe)
        db.session.commit()

        current_app.logger.info(f'Universe {universe.id} created successfully for user {user_id}')
        return jsonify({
            'message': 'Universe created successfully',
            'universe': universe.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating universe: {str(e)}')
        return jsonify({
            'message': 'Error creating universe',
            'error': str(e)
        }), 500
