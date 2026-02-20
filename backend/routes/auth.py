
from flask import session, Blueprint, request, jsonify
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import select
from models import User, TokenBlocklist
from config import db
import time

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data : dict = request.json

        if not data:
            return jsonify({'message': 'Data is needed.'}), 400
        
        email = data.get('email', '').strip().lower()
        username = data.get('username', '').strip().lower()
        
        if User.query.filter_by(username=username).first() or User.query.filter_by(_email=email).first():
            return jsonify({
                'Message': 'User already exists'
            }), 400


        new_user = User(
            name=data.get('name'),
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            bio=data.get('bio')
        )

        db.session.add(new_user)
        db.session.commit()
        access_token = create_access_token(
            identity=str(new_user.user_id), 
            additional_claims={"iat": time.time()}
            )

        return jsonify ({
            'Message': f"{new_user.username} with user id of {new_user.user_id} has been successfully created",
            'User': new_user.to_dict(),
            'access_token': access_token
            }), 201


    except  ValueError as e:
        return jsonify({f'Message:{e}'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG ERROR: {e}")
        return jsonify({'Error': 'Server Error'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username=data.get('username') 
        email=data.get('email')
        password = data.get('password')

        if not password:
            return jsonify({'Message': 'Password is required'}), 400

        user = None
        if not username and not email:
            return jsonify({'Message': 'Username or Email is required'}), 400
        elif not email and username:
            user = User.query.filter_by(username=username.strip().lower()).first()
        elif email and not username:
            user = User.query.filter_by(_email=email.strip().lower()).first()
        else:
            user = User.query.filter_by(_email=email.strip().lower()).first()


        if not user or not user.check_password(password):
            return jsonify({'Message': 'Invalid Credentials'}), 401

        access_token = create_access_token(
            identity=str(user.user_id),
            additional_claims={"iat": time.time()}
            )
        # Remember to pass summary=False if you want to see the bio!
        return jsonify({
                'access_token': access_token,
                'user': user.to_dict(summary=False),
                'message': 'User successfully logged in'
                }), 200

    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify ({'Message': 'Error occured during login'}), 500


@auth_bp.route('/token-check', methods=['GET'])
@jwt_required()
def token_check():
    user_id = get_jwt_identity()

    user = db.session.get(User, int(user_id))
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
    
