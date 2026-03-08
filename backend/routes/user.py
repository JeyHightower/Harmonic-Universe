from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import User
from config import db
from utils import get_current_user, execute_user_update, validate_auth_data,token_and_user_required, admin_required, execute_get_all_users, resource_owner_required

user_bp = Blueprint('users', __name__, url_prefix='/users')


@user_bp.route('/me', methods=['GET'])
@token_and_user_required
def get_profile(user):
    return jsonify({
        'Message': 'User profile found.',
        'User': user.to_dict(summary=False)
    }), 200 


@user_bp.route('/me', methods = ['PATCH'])
@token_and_user_required
def update_profile(user):
    data = request.get_json() or {}
    is_valid, err_msg = validate_auth_data(data, partial=True)
    if not is_valid:
        return jsonify({
            'Error': err_msg
        }), 400
    try:
        execute_user_update(user, data)
        db.session.commit()
        return jsonify({
            'Message': 'User successfully updated.', 
            'User': user.to_dict(summary=True)
        }), 200

    except (PermissionError, ValueError) as e:
        db.session.rollback()
        print(f'Error:{str(e)}')
        return jsonify({
            'Error': 'Server Error.'
        }), 500






@user_bp.route('/', methods=['GET'])
@token_and_user_required
@admin_required
def get_all_users(user, *args, **kwargs):
    print(f'Admin: {user.username}')
    users = execute_get_all_users()
    return jsonify({
        'Message': 'Users found.',
        'Admin': f'{user.username}',
        'users': [u.to_dict(summary=True) for u in users]
    }), 200


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@token_and_user_required
@resource_owner_required(User)
def delete_user(owner,user, *args, **kwargs):
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({
            'Message': 'User has been successfully deleted.'
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Error': 'Server Error'
        }), 500
