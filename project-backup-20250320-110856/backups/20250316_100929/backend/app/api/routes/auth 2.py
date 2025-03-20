"""Authentication routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from datetime import timedelta
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.core.errors import (
    ValidationError,
    AuthenticationError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    DatabaseError,
)
from backend.app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_password_hash,
)
from backend.app.core.config import settings
import logging
import time

auth_bp = Blueprint("auth_routes", __name__, url_prefix="/api/auth")
logger = logging.getLogger(__name__)

# Mock user database for testing
users_db = [
    {
        "id": 1,
        "username": "demo",
        "email": "demo@example.com",
        "password": "demo123",  # In a real app, this would be hashed
        "is_active": True,
        "created_at": int(time.time())
    }
]

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user."""
    try:
        print("DEBUG - Starting registration process")
        data = request.get_json()
        logger.info(f"Registration attempt with data: {data}")
        print(f"DEBUG - Registration attempt with data: {data}")

        # Debug request data and headers
        print(f"DEBUG - Request content type: {request.content_type}")
        print(f"DEBUG - Request headers: {dict(request.headers)}")
        print(f"DEBUG - Raw request data: {request.data}")

        if not data:
            logger.warning("Registration failed: No input data provided")
            print("DEBUG - Registration failed: No input data provided")
            raise ValidationError("No input data provided")

        if not all(k in data for k in ("email", "password", "username")):
            missing = [k for k in ("email", "password", "username") if k not in data]
            logger.warning(f"Registration failed: Missing required fields: {missing}")
            print(f"DEBUG - Registration failed: Missing required fields: {missing}")
            raise ValidationError(f'Missing required fields: {", ".join(missing)}')

        # Validate data formats
        if not isinstance(data["email"], str) or "@" not in data["email"]:
            print(f"DEBUG - Invalid email format: {data['email']}")
            raise ValidationError("Invalid email format")

        if not isinstance(data["username"], str) or len(data["username"]) < 3:
            print(f"DEBUG - Invalid username: {data['username']}")
            raise ValidationError("Username must be at least 3 characters")

        if not isinstance(data["password"], str) or len(data["password"]) < 6:
            print(f"DEBUG - Invalid password length")
            raise ValidationError("Password must be at least 6 characters")

        with get_db() as db:
            # Check if email already exists
            if db.query(User).filter_by(email=data["email"]).first():
                logger.warning(
                    f"Registration failed: Email already registered: {data['email']}"
                )
                print(
                    f"DEBUG - Registration failed: Email already registered: {data['email']}"
                )
                raise UserAlreadyExistsError("Email already registered")

            # Check if username already exists
            if db.query(User).filter_by(username=data["username"]).first():
                logger.warning(
                    f"Registration failed: Username already taken: {data['username']}"
                )
                print(
                    f"DEBUG - Registration failed: Username already taken: {data['username']}"
                )
                raise UserAlreadyExistsError("Username already taken")

            # Create new user
            try:
                print(
                    f"DEBUG - Creating user with email: {data['email']}, username: {data['username']}"
                )
                user = User(
                    email=data["email"], username=data["username"], is_active=True
                )
                print(f"DEBUG - Setting password hash")
                user.set_password(data["password"])

                print(f"DEBUG - Adding user to database")
                db.add(user)
                print(f"DEBUG - Committing to database")
                db.commit()
                print(f"DEBUG - User registered successfully with ID: {user.id}")
                logger.info(f"User registered successfully: {user.id}")
            except Exception as e:
                db.rollback()
                print(f"DEBUG - Database error during user registration: {str(e)}")
                logger.error(
                    f"Database error during user registration: {str(e)}", exc_info=True
                )
                raise DatabaseError(f"Failed to create user: {str(e)}")

            # Create tokens
            try:
                print(f"DEBUG - Creating access token")
                access_token = create_access_token(
                    subject=str(user.id),
                    expires_delta=timedelta(
                        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
                    ),
                )
                print(f"DEBUG - Creating refresh token")
                refresh_token = create_refresh_token(
                    subject=str(user.id),
                    expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
                )
            except Exception as e:
                print(f"DEBUG - Token generation error: {str(e)}")
                logger.error(f"Token generation error: {str(e)}", exc_info=True)
                raise AuthenticationError(
                    f"Failed to generate authentication tokens: {str(e)}"
                )

            # Return response
            print(f"DEBUG - Returning successful response")
            return (
                jsonify(
                    {
                        "user": user.to_dict(),
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "token_type": "bearer",
                    }
                ),
                201,
            )

    except (
        ValidationError,
        UserAlreadyExistsError,
        AuthenticationError,
        DatabaseError,
    ) as e:
        # These are expected errors, so we just raise them
        print(f"DEBUG - Expected error: {type(e).__name__}: {str(e)}")
        raise
    except Exception as e:
        # Unexpected errors
        print(f"DEBUG - Unexpected registration error: {type(e).__name__}: {str(e)}")
        import traceback

        print(f"DEBUG - Traceback: {traceback.format_exc()}")
        logger.error(f"Unexpected registration error: {str(e)}", exc_info=True)
        raise ValidationError("Registration failed. Please try again.")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login user."""
    try:
        data = request.get_json()
        if not data:
            raise ValidationError("No input data provided")

        if not all(k in data for k in ("email", "password")):
            raise ValidationError("Missing required fields: email, password")

        with get_db() as db:
            user = db.query(User).filter_by(email=data["email"]).first()
            if not user or not user.verify_password(data["password"]):
                raise InvalidCredentialsError("Invalid email or password")

            if not user.is_active:
                raise AuthenticationError("User account is inactive")

            access_token = create_access_token(
                subject=str(user.id),
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            refresh_token = create_refresh_token(
                subject=str(user.id),
                expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )

            return jsonify(
                {
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                }
            )

    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        if isinstance(e, InvalidCredentialsError):
            # Re-raise the original error to preserve the 401 status code
            raise
        elif isinstance(e, ValidationError):
            # Re-raise validation errors
            raise
        elif isinstance(e, AuthenticationError):
            # Re-raise authentication errors
            raise
        else:
            # For unexpected errors, wrap in a generic authentication error
            raise AuthenticationError("Login failed. Please try again.")


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    try:
        current_user_id = get_jwt_identity()
        token = get_jwt()

        # Verify token type
        if token.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        with get_db() as db:
            user = User.get_by_id(db, current_user_id)
            if not user or not user.is_active:
                raise AuthenticationError("User not found or inactive")

            access_token = create_access_token(
                subject=str(user.id),
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )

            return jsonify({"access_token": access_token, "token_type": "bearer"})
    except Exception as e:
        raise AuthenticationError(f"Token refresh failed: {str(e)}")


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get current user info."""
    try:
        current_user_id = get_jwt_identity()
        token = get_jwt()

        # Verify token type
        if token.get("type") != "access":
            raise AuthenticationError("Invalid token type")

        with get_db() as db:
            user = db.query(User).filter(User.id == current_user_id).first()
            if not user:
                raise AuthenticationError("User not found")
            return jsonify(user.to_dict())
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}", exc_info=True)
        raise AuthenticationError(f"Failed to fetch user info: {str(e)}")


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """Update current user info."""
    current_user_id = get_jwt_identity()
    token = get_jwt()

    # Verify token type
    if token.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    data = request.get_json()
    allowed_fields = {"username", "email"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthenticationError("User not found")

        # Check unique constraints
        if "email" in update_data:
            existing = db.query(User).filter_by(email=update_data["email"]).first()
            if existing and existing.id != current_user_id:
                raise ValidationError("Email already registered")

        if "username" in update_data:
            existing = (
                db.query(User).filter_by(username=update_data["username"]).first()
            )
            if existing and existing.id != current_user_id:
                raise ValidationError("Username already taken")

        # Update user
        for key, value in update_data.items():
            setattr(user, key, value)
        user.save(db)

        return jsonify(user.to_dict())


@auth_bp.route("/update-password", methods=["POST"])
@jwt_required()
def update_password():
    """Update user password."""
    try:
        current_user_id = get_jwt_identity()
        token = get_jwt()

        # Verify token type
        if token.get("type") != "access":
            raise AuthenticationError("Invalid token type")

        data = request.get_json()
        if not data:
            raise ValidationError("No input data provided")

        if not all(k in data for k in ("current_password", "new_password")):
            raise ValidationError(
                "Missing required fields: current_password, new_password"
            )

        # Validate new password
        if not isinstance(data["new_password"], str) or len(data["new_password"]) < 6:
            raise ValidationError("New password must be at least 6 characters")

        with get_db() as db:
            user = User.get_by_id(db, current_user_id)
            if not user:
                raise AuthenticationError("User not found")

            # Verify current password
            if not user.verify_password(data["current_password"]):
                raise InvalidCredentialsError("Current password is incorrect")

            # Update password
            user.set_password(data["new_password"])
            user.save(db)

            return jsonify(
                {"message": "Password updated successfully", "status": "success"}
            )
    except Exception as e:
        logger.error(f"Password update error: {str(e)}", exc_info=True)
        if not isinstance(
            e, (ValidationError, InvalidCredentialsError, AuthenticationError)
        ):
            raise ValidationError(f"Password update failed: {str(e)}")
        raise


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)  # Make token optional
def logout():
    """Logout user and invalidate tokens."""
    try:
        # Get the JWT ID if available
        jwt_data = get_jwt()
        if jwt_data:
            jti = jwt_data.get("jti")
            # Here you would typically add the token to a blocklist
            # For now, we'll just return success

        return jsonify({"message": "Successfully logged out", "status": "success"}), 200
    except Exception as e:
        # Log the error but still return success
        print(f"Logout error: {str(e)}")
        return (
            jsonify({"message": "Successfully logged out", "status": "success"}),
            200,
        )  # Always return success for logout


@auth_bp.route("/demo-login", methods=["POST", "OPTIONS"])
def demo_login():
    """Login as demo user."""
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response, 204

    logger.info("API V1 demo login endpoint called")

    try:
        with get_db() as db:
            # Look for demo user
            demo_user = db.query(User).filter_by(email="demo@example.com").first()

            # If demo user doesn't exist, create one
            if not demo_user:
                logger.info("Demo user not found, creating new demo user")

                demo_user = User(
                    email="demo@example.com",
                    username="demo_user",
                    is_active=True,
                    is_superuser=False,
                    hashed_password=get_password_hash("demo123"),
                )

                db.add(demo_user)
                db.commit()
                db.refresh(demo_user)
                logger.info(f"Created new demo user with id: {demo_user.id}")
            else:
                logger.info(f"Using existing demo user: {demo_user.id}")

            if not demo_user.is_active:
                logger.warning("Demo user account is inactive, activating")
                demo_user.is_active = True
                db.commit()

            # Create tokens
            access_token = create_access_token(
                subject=str(demo_user.id),
                expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            refresh_token = create_refresh_token(
                subject=str(demo_user.id),
                expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )

            logger.info("Demo login successful, returning tokens")
            return jsonify(
                {
                    "message": "Demo login successful",
                    "user": demo_user.to_dict(),
                    "token": access_token,  # Added for consistency with other implementations
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                }
            )
    except Exception as e:
        logger.error(f"Demo login error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {"message": "An error occurred during demo login", "error": str(e)}
            ),
            500,
        )
