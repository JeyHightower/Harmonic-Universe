@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """Create authentication headers."""
    with app.app_context():
        user_id = str(test_user.id)
        print(f"Creating token with user_id: {user_id} (type: {type(user_id)})")
        access_token = create_access_token(identity=user_id)
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        print(f"Generated headers: {headers}")
        return headers
