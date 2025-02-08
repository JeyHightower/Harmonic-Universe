from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required
)
from app import db
from app.models.user import User
from app.core.errors import AuthenticationError, ValidationError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ('username', 'email', 'password')):
        raise ValidationError('Missing required fields')

    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        raise ValidationError('Username already exists')
    if User.query.filter_by(email=data['email']).first():
        raise ValidationError('Email already exists')

    # Create new user
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.password = data['password']
    user.save()

    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        raise ValidationError('Missing required fields')

    # Find user and verify password
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.verify_password(data['password']):
        raise AuthenticationError('Invalid email or password')

    # Generate tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': access_token})

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    return jsonify(user.to_dict())

@auth_bp.route('/user', methods=['PATCH'])
@jwt_required()
def update_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    data = request.get_json()
    allowed_fields = {'username', 'email', 'color'}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if 'username' in update_data:
        existing = User.query.filter_by(username=update_data['username']).first()
        if existing and existing.id != current_user_id:
            raise ValidationError('Username already exists')

    if 'email' in update_data:
        existing = User.query.filter_by(email=update_data['email']).first()
        if existing and existing.id != current_user_id:
            raise ValidationError('Email already exists')

    user.update(**update_data)
    return jsonify(user.to_dict())

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a real application, you might want to blacklist the token here
    return jsonify({'message': 'Successfully logged out'})
