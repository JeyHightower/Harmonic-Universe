from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Universe, db
import logging

universes_bp = Blueprint('universes', __name__)

@universes_bp.route('/', methods=['GET'])
@jwt_required()
def get_universes():
    try:
        current_user_id = get_jwt_identity()
        logging.debug(f"Fetching universes for user {current_user_id}")
        universes = Universe.query.filter_by(user_id=current_user_id).all()
        return jsonify([universe.to_dict() for universe in universes])
    except Exception as e:
        logging.error(f"Error fetching universes: {str(e)}")
        return jsonify({"error": str(e)}), 422

@universes_bp.route('/', methods=['POST'])
@jwt_required()
def create_universe():
    try:
        data = request.get_json()
        logging.debug(f"Received universe data: {data}")

        # Validate required fields
        if not data or 'name' not in data:
            return jsonify({"error": "Name is required"}), 422

        current_user_id = get_jwt_identity()

        # Create universe with all parameters
        universe = Universe(
            name=data['name'],
            description=data.get('description', ''),
            user_id=current_user_id,
            physics_parameters=data.get('physics_parameters', {}),
            harmony_parameters=data.get('harmony_parameters', {}),
            is_public=data.get('is_public', False)
        )

        db.session.add(universe)
        db.session.commit()

        return jsonify(universe.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating universe: {str(e)}")
        return jsonify({"error": str(e)}), 422
