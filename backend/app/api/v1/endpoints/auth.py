from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from app.services.auth_service import AuthService
from app.extensions import db

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    auth_service = AuthService(db.session)
    try:
        user = auth_service.create_user(email, password)
        return jsonify({
            "message": "Registration successful. Please check your email to verify your account.",
            "user_id": user.id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({"error": "Verification token is required"}), 400

    auth_service = AuthService(db.session)
    if auth_service.verify_email(token):
        return jsonify({"message": "Email verified successfully"}), 200
    return jsonify({"error": "Invalid or expired verification token"}), 400

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    auth_service = AuthService(db.session)
    user = auth_service.authenticate_user(email, password)

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.is_verified:
        return jsonify({"error": "Please verify your email before logging in"}), 401

    access_token = create_access_token(identity=user.id)
    refresh_token = user.generate_refresh_token()
    db.session.commit()

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_verified": user.is_verified
        }
    }), 200

@bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if not refresh_token:
        return jsonify({"error": "Refresh token is required"}), 400

    auth_service = AuthService(db.session)
    result = auth_service.refresh_access_token(refresh_token)

    if not result:
        return jsonify({"error": "Invalid or expired refresh token"}), 401

    return jsonify(result), 200

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if refresh_token:
        auth_service = AuthService(db.session)
        auth_service.revoke_refresh_token(refresh_token)

    return jsonify({"message": "Logged out successfully"}), 200

@bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    auth_service = AuthService(db.session)
    auth_service.request_password_reset(email)

    # Always return success to prevent email enumeration
    return jsonify({
        "message": "If an account exists with this email, you will receive password reset instructions"
    }), 200

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    auth_service = AuthService(db.session)
    if auth_service.reset_password(token, new_password):
        return jsonify({"message": "Password reset successful"}), 200
    return jsonify({"error": "Invalid or expired reset token"}), 400
