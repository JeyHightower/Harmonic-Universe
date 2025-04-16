#!/usr/bin/env python
"""
Test script for diagnosing JWT configuration issues.
This script will generate a token, verify it, and then use it to test the API.
"""

import os
import sys
import json
import jwt
import requests
from datetime import datetime, timedelta

# Define constants
SECRET_KEY = 'jwt-secret-key'  # Default in config.py
API_BASE_URL = 'http://localhost:5001/api'
USER_ID = 1  # Demo user ID

def generate_token(user_id, secret_key):
    """Generate a JWT token for the user."""
    now = datetime.utcnow()
    payload = {
        'fresh': False,
        'iat': int(now.timestamp()),
        'jti': f'test-token-{now.timestamp()}',
        'type': 'access',
        'sub': str(user_id),  # Must be a string
        'nbf': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp())
    }
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token

def verify_token(token, secret_key):
    """Verify a JWT token."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return True, payload
    except Exception as e:
        return False, str(e)

def test_api_with_token(token):
    """Test the API with the token."""
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    # Test universes endpoint
    response = requests.get(f'{API_BASE_URL}/universes/', headers=headers)
    print(f"Universes response status: {response.status_code}")
    print(f"Universes response body: {response.text}")
    return response.status_code == 200

def main():
    # Generate a token with our hard-coded secret key
    token = generate_token(USER_ID, SECRET_KEY)
    print(f"Generated token: {token}")
    
    # Verify the token
    is_valid, payload = verify_token(token, SECRET_KEY)
    print(f"Token valid: {is_valid}")
    if is_valid:
        print(f"Token payload: {json.dumps(payload, indent=2)}")
    else:
        print(f"Token verification error: {payload}")
        
    # Test the API with the token
    print("\nTesting API with token...")
    success = test_api_with_token(token)
    print(f"API test {'successful' if success else 'failed'}")
    
    # If the test fails, try with a demo login token
    if not success:
        print("\nTrying with demo login token...")
        response = requests.get(f'{API_BASE_URL}/auth/demo-login/')
        if response.status_code == 200:
            demo_token = response.json().get('token')
            if demo_token:
                print(f"Demo token: {demo_token}")
                
                # Try to decode the demo token without verification to see its contents
                try:
                    unverified_payload = jwt.decode(demo_token, options={"verify_signature": False})
                    print(f"Demo token unverified payload: {json.dumps(unverified_payload, indent=2)}")
                except Exception as e:
                    print(f"Error decoding demo token: {str(e)}")
                
                # Try to verify with our key
                is_valid, payload = verify_token(demo_token, SECRET_KEY)
                print(f"Demo token valid with our key: {is_valid}")
                if not is_valid:
                    print(f"Demo token verification error: {payload}")
                    
                # Try to guess the secret key by attempting with common values
                common_keys = [
                    'jwt-secret-key',
                    'development-jwt-secret-key',
                    'production-jwt-secret-key',
                    'harmonic-universe',
                    'harmonic_universe',
                    'secret-key',
                    'SECRET_KEY',
                    'JWT_SECRET_KEY',
                    'dev-secret-key'
                ]
                
                working_key = None
                for key in common_keys:
                    is_valid, payload = verify_token(demo_token, key)
                    if is_valid:
                        print(f"Found working secret key: '{key}'")
                        print(f"Token payload: {json.dumps(payload, indent=2)}")
                        working_key = key
                        break
                
                # Try with this working key and generate a new token
                if working_key:
                    new_token = generate_token(USER_ID, working_key)
                    print(f"\nGenerated new token with working key: {new_token}")
                    success = test_api_with_token(new_token)
                    print(f"API test with our new token: {'successful' if success else 'failed'}")
        else:
            print(f"Could not get demo token, status: {response.status_code}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 