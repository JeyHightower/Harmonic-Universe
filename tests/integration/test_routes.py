import json
from flask_jwt_extended import decode_token

def test_protected_routes(client, auth_headers):
    """Test routes that require authentication."""
    # Test getting user profile
    print("\nAuth headers:", auth_headers)
    token = auth_headers['Authorization'].split()[1]  # Get token from 'Bearer <token>'
    try:
        decoded = decode_token(token)
        print("Decoded token:", decoded)
    except Exception as e:
        print("Token decode error:", str(e))

    response = client.get('/api/auth/me', headers=auth_headers)
    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.get_data(as_text=True)}")
    print(f"Auth headers: {auth_headers}")
    assert response.status_code == 200
    assert 'user' in response.json
