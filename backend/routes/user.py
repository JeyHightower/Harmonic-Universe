from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import User
from config import db
from utils import get_current_user, admin_required, execute_get_all_users

user_bp = Blueprint('users', __name__, url_prefix='/users')


@user_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({
        'Message': 'User not found.'
        }),404
    return jsonify({
        'Message': 'User profile found.',
        'User': user.to_dict(summary=False)
    }), 200 


@user_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users(user):
    print(f'Admin: {user.username}')
    users = execute_get_all_users()
    return jsonify({
        'Message': 'Users found.',
        'Admin': f'{user.username}',
        'users': [u.to_dict(summary=True) for u in users]
    }), 200
