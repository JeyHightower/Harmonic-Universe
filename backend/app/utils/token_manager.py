import requests
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g

class TokenManager:
    _instance = None
    _token = None
    _user = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TokenManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_token(cls):
        """Get current token or fetch new one if needed"""
        if cls._token is None:
            cls._token = cls._fetch_token()
        return cls._token

    @classmethod
    def _fetch_token(cls):
        """Fetch new token using stored credentials"""
        try:
            response = requests.post(
                'http://localhost:5000/auth/token',
                json={
                    'email': 'test@example.com',  # Default test credentials
                    'password': 'Password123'
                }
            )
            if response.status_code == 200:
                data = response.json()
                cls._token = data['token']
                cls._user = data['user']
                return cls._token
        except Exception as e:
            print(f"Error fetching token: {str(e)}")
        return None

    @classmethod
    def refresh_token(cls):
        """Refresh the current token"""
        if cls._token:
            try:
                response = requests.post(
                    'http://localhost:5000/auth/token/refresh',
                    headers={'Authorization': f'Bearer {cls._token}'}
                )
                if response.status_code == 200:
                    data = response.json()
                    cls._token = data['token']
                    cls._user = data['user']
                    return cls._token
            except Exception as e:
                print(f"Error refreshing token: {str(e)}")
        return cls._fetch_token()

def auto_token(f):
    """Decorator to automatically handle token authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = TokenManager.get_token()
        if not token:
            return jsonify({'error': 'Could not obtain authentication token'}), 401

        try:
            # Try to decode token to check if expired
            jwt.decode(token, 'dev-secret-key', algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            # Token expired, try to refresh
            token = TokenManager.refresh_token()
            if not token:
                return jsonify({'error': 'Could not refresh authentication token'}), 401
        except jwt.InvalidTokenError:
            # Invalid token, try to get new one
            token = TokenManager._fetch_token()
            if not token:
                return jsonify({'error': 'Could not obtain valid authentication token'}), 401

        # Add token to request headers
        request.headers = {
            **request.headers,
            'Authorization': f'Bearer {token}'
        }

        return f(*args, **kwargs)
    return decorated
