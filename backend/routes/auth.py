
from flask import session, Blueprint, request, jsonify
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select
from models import User, TokenBlocklist
from config import db
from utils import validate_auth_data, validate_login_data, authenticate_user, execute_user_creation
import time

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data : dict = request.get_json() or {}

        is_valid, error_msg = validate_auth_data(data)
        if not is_valid:
            return jsonify({
                'Error': error_msg
            }), 400

        new_user = execute_user_creation(data)
        access_token = create_access_token(
            identity=str(new_user.user_id)
            )

        return jsonify ({
            'Message': f"{new_user.username} with user id of {new_user.user_id} has been successfully created",
            'User': new_user.to_dict(),
            'access_token': access_token
            }), 201


    except  ValueError as e:
        db.session.rollback()
        return jsonify({f'Message:{e}'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG ERROR: {e}")
        return jsonify({'Error': 'Server Error'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:   
        data = request.get_json() or {}
        is_valid, error_msg = validate_login_data(data)
        if not is_valid:
            return jsonify({
                'Error': error_msg
            }), 400
        user = authenticate_user(data)
        if not user:
            return jsonify({
                'Error': 'Invalid username/email or password.'
            }), 401

        access_token = create_access_token(
            identity=str(user.user_id)
            )

        return jsonify({
                'access_token': access_token,
                'user': user.to_dict(summary=False),
                'message': 'User successfully logged in'
                }), 200

    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify ({'Message': 'Error occured during login'}), 500


@auth_bp.route('/token-check', methods=['GET'])
@jwt_required()
def token_check():
    user_id = int(get_jwt_identity())

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({
            'Message': 'User not found'
        }), 404
    return jsonify({
        'Message': 'token still valid.',
        'user':user.to_dict()}), 200



@auth_bp.route('/logout', methods= ['DELETE'])
@jwt_required()
def logout():
    try:
        jti = get_jwt()["jti"]
        blocked_token = TokenBlocklist(
            jti = jti,
            created_at = datetime.now(timezone.utc)
        )
        db.session.add(blocked_token)
        db.session.commit()
        return jsonify({
                    'Message': 'Logout Successful'
                }), 200
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')
        return jsonify({
            'Message': 'Server Error.'
        }), 500
    
