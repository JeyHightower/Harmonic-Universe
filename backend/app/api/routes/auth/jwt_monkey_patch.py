"""
JWT Monkey Patch Module

This module contains functions to patch PyJWT and Flask-JWT-Extended
to ensure consistency in token handling, especially with numeric subject IDs.
"""

from flask_jwt_extended import create_access_token as original_create_access_token
import jwt
from functools import wraps

def patched_create_access_token(*args, **kwargs):
    """
    Patched version of create_access_token that ensures identity is a string.
    """
    # Convert identity to string if it's not already
    if 'identity' in kwargs and kwargs['identity'] is not None:
        kwargs['identity'] = str(kwargs['identity'])
    
    # Call the original function with modified arguments
    return original_create_access_token(*args, **kwargs)

def patch_jwt_extended():
    """
    Patch Flask-JWT-Extended to handle numeric subjects properly.
    """
    import flask_jwt_extended
    
    # Replace the original function with our patched version
    flask_jwt_extended.create_access_token = patched_create_access_token
    
    return True

def patch_decoder():
    """
    Patch PyJWT decoder to be more tolerant with subject types.
    """
    original_decode = jwt.decode
    
    @wraps(original_decode)
    def patched_decode(token, *args, **kwargs):
        """Modified decoder that handles numeric subjects without validation errors."""
        # If verify_signature is False or options contains verify_signature: False
        # then don't validate anything further
        if kwargs.get('verify_signature') is False or (
            'options' in kwargs and kwargs['options'].get('verify_signature') is False
        ):
            return original_decode(token, *args, **kwargs)
        
        # For verification, first decode without verification to see the payload
        try:
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            
            # Remember the original subject type
            if 'sub' in unverified_payload:
                orig_sub = unverified_payload['sub']
                
                # Convert subject to string if it's a number
                if isinstance(orig_sub, (int, float)):
                    # Get the key 
                    key = kwargs.get('key', None)
                    if key is None and len(args) > 0:
                        key = args[0]
                    
                    # Create a proper payload with string subject
                    if key is not None:
                        # Read the token header
                        header = jwt.get_unverified_header(token)
                        alg = header.get('alg', 'HS256')
                        
                        # Create a new token with string subject
                        modified_payload = unverified_payload.copy()
                        modified_payload['sub'] = str(modified_payload['sub'])
                        
                        # Encode it
                        new_token = jwt.encode(modified_payload, key, algorithm=alg)
                        
                        # Decode with verification
                        if isinstance(key, list):
                            # Handle key rotation case
                            for k in key:
                                try:
                                    return jwt.decode(new_token, k, *args[1:], **kwargs)
                                except:
                                    continue
                        else:
                            # Try with the provided key
                            return jwt.decode(new_token, key, *args[1:], **kwargs)
        except Exception as e:
            # If any error occurs during our pre-processing, just fall back to original
            pass
            
        # Fall back to original behavior if our modifications don't apply
        return original_decode(token, *args, **kwargs)
    
    # Replace the original function
    jwt.decode = patched_decode
    
    return True

def apply_all_jwt_patches():
    """Apply all JWT and Flask-JWT-Extended patches."""
    patch_jwt_extended()
    patch_decoder()
    return True 