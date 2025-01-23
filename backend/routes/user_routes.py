from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models.user import User

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']

    db.session.commit()
    return jsonify(user.to_dict())

@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
