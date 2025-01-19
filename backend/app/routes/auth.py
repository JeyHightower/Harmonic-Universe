from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app.extensions import db, limiter

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        if not data.get('email') or not data.get('password'):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'status': 'error',
                'message': 'Email already registered'
            }), 409

        user = User(
            email=data['email'],
            password=data['password']  # Password will be hashed in User.__init__
        )

        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=user.id)
        return jsonify({
            'status': 'success',
            'data': {
                'token': token,
                'user': user.to_dict()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@auth_bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        if not data.get('email') or not data.get('password'):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not check_password_hash(user.password, data['password']):
            return jsonify({
                'status': 'error',
                'message': 'Invalid credentials'
            }), 401

        token = create_access_token(identity=user.id)
        return jsonify({
            'status': 'success',
            'data': {
                'token': token,
                'user': user.to_dict()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({
        'status': 'success',
        'message': 'Successfully logged out'
    }), 200

@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
@limiter.limit("30 per minute")
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        return jsonify({
            'status': 'success',
            'data': {
                'user': user.to_dict()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
