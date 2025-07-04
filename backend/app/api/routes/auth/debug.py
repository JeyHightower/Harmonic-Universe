from flask import jsonify, current_app, request
from flask_jwt_extended import JWTManager, create_access_token
from flask_cors import cross_origin
import os
import sys
import jwt

from . import auth_bp

@auth_bp.route('/debug-jwt', methods=['GET', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def debug_jwt():
    """Debug endpoint to check JWT configuration."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        # Only available in development mode
        if current_app.config.get('ENV') != 'development':
            return jsonify({'message': 'Debug endpoint only available in development mode'}), 403

        # Get the app's JWT configuration
        jwt_config = {
            'JWT_SECRET_KEY': _mask_key(current_app.config.get('JWT_SECRET_KEY')),
            'JWT_SECRET_KEY_ENV': _mask_key(os.environ.get('JWT_SECRET_KEY')),
            'JWT_PUBLIC_KEY': current_app.config.get('JWT_PUBLIC_KEY') is not None,
            'JWT_PRIVATE_KEY': current_app.config.get('JWT_PRIVATE_KEY') is not None,
            'JWT_ALGORITHM': current_app.config.get('JWT_ALGORITHM'),
            'JWT_ACCESS_TOKEN_EXPIRES': str(current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES')),
            'JWT_REFRESH_TOKEN_EXPIRES': str(current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES')),
            'JWT_IDENTITY_CLAIM': current_app.config.get('JWT_IDENTITY_CLAIM'),
            'JWT_HEADER_TYPE': current_app.config.get('JWT_HEADER_TYPE'),
            'JWT_HEADER_NAME': current_app.config.get('JWT_HEADER_NAME'),
            'JWT_TOKEN_LOCATION': current_app.config.get('JWT_TOKEN_LOCATION'),
            'JWT manager initialized': JWTManager.jwt_manager is not None if hasattr(JWTManager, 'jwt_manager') else 'Unknown',
            'ENV': current_app.config.get('ENV'),
            'SECRET_KEY_FULL': current_app.config.get('JWT_SECRET_KEY') == os.environ.get('JWT_SECRET_KEY'),
        }

        # Generate a test token for validation
        try:
            current_app.logger.info('Generating test token')
            secret_key = current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY')
            test_token = jwt.encode({'sub': 1, 'test': True}, secret_key, algorithm='HS256')
            jwt_config['test_token'] = test_token
            jwt_config['test_token_decode'] = jwt.decode(test_token, secret_key, algorithms=['HS256'])
            jwt_config['test_token_validation'] = 'Success'
        except Exception as e:
            jwt_config['test_token_error'] = str(e)

        # Get debug info from any Auth header
        auth_header = request.headers.get('Authorization')
        auth_debug = {}

        if auth_header:
            auth_debug['Authorization'] = auth_header

            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                auth_debug['token_provided'] = True

                try:
                    # Try to decode without verification
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    auth_debug['token_payload'] = decoded

                    # Also try to verify (will fail with wrong secret)
                    try:
                        decoded_verified = jwt.decode(
                            token,
                            key=current_app.config.get('JWT_SECRET_KEY') or os.environ.get('JWT_SECRET_KEY'),
                            algorithms=[current_app.config.get('JWT_ALGORITHM', 'HS256')]
                        )
                        auth_debug['token_verification'] = 'Success'
                    except Exception as verify_err:
                        auth_debug['token_verification'] = f'Failed: {str(verify_err)}'

                except Exception as decode_err:
                    auth_debug['token_decode_error'] = str(decode_err)
            else:
                auth_debug['token_format'] = 'Invalid - must start with Bearer'

        # Check installed packages
        jwt_packages = {}
        for module_name in ['flask_jwt_extended', 'jwt', 'pyjwt']:
            try:
                module = __import__(module_name)
                jwt_packages[module_name] = getattr(module, '__version__', 'version unknown')
            except ImportError:
                jwt_packages[module_name] = 'Not installed'

        debug_info = {
            'jwt_config': jwt_config,
            'auth_header_debug': auth_debug,
            'jwt_packages': jwt_packages,
            'python_version': sys.version,
            'fixed_get_secret_key': _get_fixed_get_secret_key_info()
        }

        return jsonify(debug_info), 200

    except Exception as e:
        current_app.logger.error(f'JWT debug error: {str(e)}')
        return jsonify({'message': 'Error during JWT debugging', 'error': str(e)}), 500

@auth_bp.route('/debug/token-test', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def debug_token_test():
    """Debug endpoint to test token creation and verification."""
    # Handle OPTIONS requests for CORS preflight
    if request.method == 'OPTIONS':
        return current_app.make_default_options_response()

    try:
        # Get the JWT secret key from config
        secret_key = current_app.config.get('JWT_SECRET_KEY')
        if not secret_key:
            secret_key = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')

        # Create a test token
        test_token = create_access_token(identity=1)

        # Try to decode the token with PyJWT directly to verify
        try:
            # Decode without verification first
            unverified_payload = jwt.decode(test_token, options={"verify_signature": False})

            # Then try to verify with our secret key
            try:
                verified_payload = jwt.decode(test_token, secret_key, algorithms=['HS256'])
                verification_status = "SUCCESS"
            except Exception as e:
                verification_status = f"FAILED: {str(e)}"

            # Check for token in authorization header
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                user_token = auth_header.split(' ')[1]

                # Try to verify user token
                try:
                    user_payload = jwt.decode(user_token, secret_key, algorithms=['HS256'])
                    user_token_status = "VALID"
                except Exception as e:
                    user_token_status = f"INVALID: {str(e)}"

                    # Try with other keys
                    other_keys = ['jwt-secret-key', 'development-jwt-secret-key', 'secret-key']
                    success_key = None

                    for key in other_keys:
                        try:
                            if key != secret_key:  # Skip if same as current
                                test_payload = jwt.decode(user_token, key, algorithms=['HS256'])
                                success_key = key
                                break
                        except:
                            pass

                    if success_key:
                        user_token_status += f" (But valid with key: '{success_key}')"
            else:
                user_token = None
                user_token_status = "NOT PROVIDED"

            return jsonify({
                'current_config': {
                    'jwt_secret_key': secret_key[:3] + '...' if secret_key else None,
                    'jwt_secret_key_length': len(secret_key) if secret_key else 0,
                },
                'test_token': test_token,
                'test_token_payload': unverified_payload,
                'test_token_verification': verification_status,
                'user_token': user_token,
                'user_token_status': user_token_status if user_token else None,
                'message': 'JWT debug information'
            }), 200

        except Exception as decode_error:
            return jsonify({
                'jwt_secret_key': secret_key[:3] + '...' if secret_key else None,
                'test_token': test_token,
                'error': f"Token decode error: {str(decode_error)}",
                'message': 'Error decoding JWT token'
            }), 500

    except Exception as e:
        current_app.logger.error(f"JWT debug error: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Error in JWT debug endpoint'
        }), 500

def _mask_key(key):
    """Mask a key for display (without revealing it fully)."""
    if not key:
        return None
    if len(key) <= 6:
        return key
    return key[:4] + '***' + key[-2:]

def _get_fixed_get_secret_key_info():
    """Check if the patched get_secret_key function is in place."""
    try:
        from flask_jwt_extended.config import get_secret_key

        def _fixed_get_secret_key():
            """Patched version of the function."""
            key = current_app.config['JWT_SECRET_KEY']
            if key is None:
                key = os.environ.get('JWT_SECRET_KEY')
                if key is None:
                    raise RuntimeError('JWT_SECRET_KEY not set')
            return key

        # Compare function code to see if our patch is in place
        import inspect
        fixed_src = inspect.getsource(_fixed_get_secret_key).strip()
        actual_src = inspect.getsource(get_secret_key).strip()

        return {
            'patched': fixed_src in actual_src,
            'check_env_var': 'os.environ.get' in actual_src
        }
    except Exception as e:
        return {'error': str(e)}
