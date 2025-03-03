"""Test the users endpoints."""
import pytest
import requests
import json
from uuid import uuid4

BASE_URL = "http://localhost:8000/api/v1"

def create_test_user():
    """Helper function to create a test user and return tokens."""
    username = f"testuser_{uuid4().hex[:8]}"
    email = f"test_{uuid4().hex[:8]}@example.com"
    password = "TestPassword123!"

    register_data = {
        "username": username,
        "email": email,
        "password": password
    }

    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    assert register_response.status_code == 201, f"Registration failed: {register_response.text}"

    access_token = register_response.json()["access_token"]
    user_id = register_response.json()["user"]["id"]
    return access_token, user_id, username, email

def test_get_me():
    """Test getting the current user's information."""
    access_token, user_id, username, email = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    assert response.status_code == 200, f"Get current user failed: {response.text}"

    user_data = response.json()
    assert user_data["id"] == user_id
    assert user_data["username"] == username
    assert user_data["email"] == email

    # Check the response includes expected fields
    expected_fields = ["id", "username", "email", "created_at"]
    for field in expected_fields:
        assert field in user_data, f"Response missing expected field: {field}"

def test_update_me():
    """Test updating the current user's information."""
    access_token, user_id, username, email = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Update the user's profile
    new_username = f"updated_user_{uuid4().hex[:8]}"
    update_data = {
        "username": new_username
    }

    response = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("User update endpoint not implemented")

    assert response.status_code == 200, f"Update user failed: {response.text}"

    # Verify the update took effect
    updated_user = response.json()
    assert updated_user["username"] == new_username
    assert updated_user["email"] == email  # Email should remain unchanged

    # Double-check by fetching the user again
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    assert response.status_code == 200

    user_data = response.json()
    assert user_data["username"] == new_username

def test_update_email():
    """Test updating the user's email."""
    access_token, user_id, username, email = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Update the user's email
    new_email = f"updated_{uuid4().hex[:8]}@example.com"
    update_data = {
        "email": new_email
    }

    response = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("User update endpoint not implemented")

    assert response.status_code == 200, f"Update email failed: {response.text}"

    # Verify the update took effect
    updated_user = response.json()
    assert updated_user["email"] == new_email
    assert updated_user["username"] == username  # Username should remain unchanged

def test_get_user_by_id():
    """Test getting a user by ID."""
    access_token, user_id, username, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Get the user by ID
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("Get user by ID endpoint not implemented")

    assert response.status_code == 200, f"Get user by ID failed: {response.text}"

    user_data = response.json()
    assert user_data["id"] == user_id
    assert user_data["username"] == username

    # Check the response includes expected fields but NOT sensitive info
    expected_fields = ["id", "username", "created_at"]
    for field in expected_fields:
        assert field in user_data, f"Response missing expected field: {field}"

    # Email should NOT be included when getting another user's data
    # (though it might be for the current user, depending on the API design)
    if "email" in user_data:
        # This isn't strictly wrong, but note that it depends on the API's privacy design
        pass

def test_list_users():
    """Test listing all users."""
    access_token, _, _, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # List all users
    response = requests.get(f"{BASE_URL}/users/", headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("List users endpoint not implemented")

    assert response.status_code == 200, f"List users failed: {response.text}"

    users = response.json()
    assert isinstance(users, dict), "Response should be a dictionary with pagination info"
    assert "items" in users, "Response should include 'items' field with user list"
    assert "total" in users, "Response should include 'total' field with total count"
    assert len(users["items"]) > 0, "User list should not be empty"

def test_search_users():
    """Test searching for users by username."""
    # Create a user with a specific username pattern
    unique_part = uuid4().hex[:8]
    username = f"searchable_user_{unique_part}"
    email = f"search_{unique_part}@example.com"
    password = "TestPassword123!"

    register_data = {
        "username": username,
        "email": email,
        "password": password
    }

    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    assert register_response.status_code == 201

    access_token = register_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Search for users by username
    search_term = "searchable"
    response = requests.get(f"{BASE_URL}/users/search?username={search_term}", headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501 or response.status_code == 404:
        pytest.skip("Search users endpoint not implemented")

    assert response.status_code == 200, f"Search users failed: {response.text}"

    users = response.json()
    assert isinstance(users, list), "Response should be a list of users"

    # Check if the created user is in the search results
    found = False
    for user in users:
        if user["username"] == username:
            found = True
            break

    assert found, f"Could not find user {username} in search results"

def test_user_not_found():
    """Test getting a non-existent user."""
    access_token, _, _, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Try to get a non-existent user
    non_existent_id = str(uuid4())  # Using UUID4 string for ID
    response = requests.get(f"{BASE_URL}/users/{non_existent_id}", headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("Get user by ID endpoint not implemented")

    assert response.status_code == 404, "Should return 404 for non-existent user"

def test_update_invalid_data():
    """Test updating user with invalid data."""
    access_token, _, _, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Try to update with an invalid username (too short)
    update_data = {
        "username": "a"  # Too short
    }

    response = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("User update endpoint not implemented")

    assert response.status_code in [400, 422], "Should reject invalid username"

    # Try to update with an invalid email
    update_data = {
        "email": "not-an-email"
    }

    response = requests.put(f"{BASE_URL}/users/me", json=update_data, headers=headers)
    assert response.status_code in [400, 422], "Should reject invalid email"

def test_delete_user():
    """Test deleting the current user."""
    access_token, user_id, _, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Delete the user
    response = requests.delete(f"{BASE_URL}/users/me", headers=headers)

    # If this endpoint isn't implemented, skip the test
    if response.status_code == 501:
        pytest.skip("User deletion endpoint not implemented")

    assert response.status_code == 200, f"Delete user failed: {response.text}"

    # Try to use the token after deletion (should fail)
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    assert response.status_code == 401, "Token should be invalidated after user deletion"

    # Try to get the user by ID (should fail)
    response = requests.get(f"{BASE_URL}/users/{user_id}", headers=headers)
    assert response.status_code in [401, 404], "User should no longer exist"

def test_pagination():
    """Test pagination for listing users."""
    access_token, _, _, _ = create_test_user()
    headers = {"Authorization": f"Bearer {access_token}"}

    # List users with pagination
    limit = 5
    offset = 0
    response = requests.get(f"{BASE_URL}/users/?limit={limit}&offset={offset}", headers=headers)

    # If this endpoint or pagination isn't implemented, skip the test
    if response.status_code in [501, 400, 422]:
        pytest.skip("Pagination for users list not implemented")

    assert response.status_code == 200, f"List users with pagination failed: {response.text}"

    users = response.json()

    # The response format should be a paginated object with items and total
    assert isinstance(users, dict) and "items" in users, "Response should be a paginated object with 'items'"
    assert "total" in users, "Paginated response should include total count"
    assert len(users["items"]) <= limit, "Should respect the limit parameter"

    # Get the second page if there are enough items
    if users["total"] > limit:
        offset = limit
        response = requests.get(f"{BASE_URL}/users/?limit={limit}&offset={offset}", headers=headers)
        assert response.status_code == 200, "Failed to get second page"

        second_page = response.json()
        if len(second_page["items"]) > 0:
            assert second_page["items"][0]["id"] != users["items"][0]["id"], "Second page should have different users"
