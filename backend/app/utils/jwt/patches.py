"""
JWT Monkey Patches

This module contains functions to patch PyJWT and Flask-JWT-Extended
to ensure consistency in token handling, especially with numeric subject IDs.
"""

import jwt
from functools import wraps

def patch_create_access_token():
    """
    Patch create_access_token to ensure identity is always a string.
    """
    from flask_jwt_extended import create_access_token as original_create_access_token
    
    @wraps(original_create_access_token)
    def patched_create_access_token(*args, **kwargs):
        if 'identity' in kwargs and kwargs['identity'] is not None:
            kwargs['identity'] = str(kwargs['identity'])
        return original_create_access_token(*args, **kwargs)
    
    # Replace the original function
    import flask_jwt_extended
    flask_jwt_extended.create_access_token = patched_create_access_token

def patch_jwt_decoder():
    """
    Patch PyJWT decoder to handle numeric subjects consistently.
    """
    original_decode = jwt.decode
    
    @wraps(original_decode)
    def patched_decode(token, *args, **kwargs):
        # Skip additional processing if not verifying signature
        if kwargs.get('verify_signature') is False or (
            'options' in kwargs and kwargs['options'].get('verify_signature') is False
        ):
            return original_decode(token, *args, **kwargs)
        
        try:
            # First decode without verification
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            
            # Handle numeric subjects
            if 'sub' in unverified_payload:
                orig_sub = unverified_payload['sub']
                if isinstance(orig_sub, (int, float)):
                    # Get the key for verification
                    key = kwargs.get('key', args[0] if args else None)
                    if key is not None:
                        # Create new token with string subject
                        header = jwt.get_unverified_header(token)
                        alg = header.get('alg', 'HS256')
                        
                        modified_payload = unverified_payload.copy()
                        modified_payload['sub'] = str(modified_payload['sub'])
                        
                        new_token = jwt.encode(modified_payload, key, algorithm=alg)
                        
                        # Handle key rotation if needed
                        if isinstance(key, list):
                            for k in key:
                                try:
                                    return jwt.decode(new_token, k, *args[1:], **kwargs)
                                except:
                                    continue
                        else:
                            return jwt.decode(new_token, key, *args[1:], **kwargs)
        except:
            pass
            
        # Fall back to original behavior
        return original_decode(token, *args, **kwargs)
    
    # Replace the original decode function
    jwt.decode = patched_decode

def apply_all_jwt_patches():
    """
    Apply all JWT-related patches.
    """
    patch_create_access_token()
    patch_jwt_decoder()
    return True 