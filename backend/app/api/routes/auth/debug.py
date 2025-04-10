from flask import jsonify, current_app, request
from flask_jwt_extended import JWTManager
import os
import sys
import jwt

from . import auth_bp

@auth_bp.route('/debug-jwt', methods=['GET'])
def debug_jwt():
    """Debug endpoint to check JWT configuration."""
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
            'JWT manager initialized': JWTManager.jwt_manager is not None if hasattr(JWTManager, 'jwt_manager') else 'Unknown'
        }
        
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

def _mask_key(key):
    """Mask a secret key for safe display."""
    if not key:
        return None
    if len(key) <= 8:
        return "***" 
    return key[:4] + "***" + key[-2:]

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