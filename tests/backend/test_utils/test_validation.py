import pytest
from app.utils.validation import validate_registration, validate_login

def test_validate_registration_valid_data():
    """Test registration validation with valid data"""
    valid_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123"
    }
    assert validate_registration(valid_data) is None

def test_validate_registration_missing_data():
    """Test registration validation with missing data"""
    # Test with None
    assert validate_registration(None) == "No data provided"

    # Test with empty dict
    assert validate_registration({}) == "Username is required"

    # Test missing email
    data = {
        "username": "testuser",
        "password": "TestPass123"
    }
    assert validate_registration(data) == "Email is required"

    # Test missing password
    data = {
        "username": "testuser",
        "email": "test@example.com"
    }
    assert validate_registration(data) == "Password is required"

def test_validate_registration_username():
    """Test username validation rules"""
    base_data = {
        "email": "test@example.com",
        "password": "TestPass123"
    }

    # Test short username
    data = {**base_data, "username": "ab"}
    assert validate_registration(data) == "Username must be at least 3 characters long"

    # Test long username
    data = {**base_data, "username": "a" * 31}
    assert validate_registration(data) == "Username must be less than 30 characters"

    # Test invalid characters
    data = {**base_data, "username": "test@user"}
    assert validate_registration(data) == "Username can only contain letters, numbers, underscores, and hyphens"

    # Test valid usernames
    valid_usernames = ["test_user", "test-user", "testuser123", "TestUser"]
    for username in valid_usernames:
        data = {**base_data, "username": username}
        assert validate_registration(data) is None

def test_validate_registration_email():
    """Test email validation rules"""
    base_data = {
        "username": "testuser",
        "password": "TestPass123"
    }

    # Test invalid email formats
    invalid_emails = [
        "test@",
        "@example.com",
        "test@.com",
        "test@com",
        "test.example.com",
        "test@example.",
        "test space@example.com"
    ]
    for email in invalid_emails:
        data = {**base_data, "email": email}
        assert validate_registration(data) == "Invalid email format"

    # Test valid email formats
    valid_emails = [
        "test@example.com",
        "test.user@example.com",
        "test+user@example.com",
        "test_user@example.co.uk",
        "test123@example.com"
    ]
    for email in valid_emails:
        data = {**base_data, "email": email}
        assert validate_registration(data) is None

def test_validate_registration_password():
    """Test password validation rules"""
    base_data = {
        "username": "testuser",
        "email": "test@example.com"
    }

    # Test short password
    data = {**base_data, "password": "Short1"}
    assert validate_registration(data) == "Password must be at least 8 characters long"

    # Test long password
    data = {**base_data, "password": "A" * 129}
    assert validate_registration(data) == "Password must be less than 128 characters"

    # Test missing uppercase
    data = {**base_data, "password": "testpass123"}
    assert validate_registration(data) == "Password must contain at least one uppercase letter"

    # Test missing lowercase
    data = {**base_data, "password": "TESTPASS123"}
    assert validate_registration(data) == "Password must contain at least one lowercase letter"

    # Test missing number
    data = {**base_data, "password": "TestPassWord"}
    assert validate_registration(data) == "Password must contain at least one number"

    # Test valid passwords
    valid_passwords = [
        "TestPass123",
        "SecurePassword1",
        "MyP@ssw0rd",
        "Abcd1234",
        "Test123Pass"
    ]
    for password in valid_passwords:
        data = {**base_data, "password": password}
        assert validate_registration(data) is None

def test_validate_login_valid_data():
    """Test login validation with valid data"""
    valid_data = {
        "email": "test@example.com",
        "password": "TestPass123"
    }
    assert validate_login(valid_data) is None

def test_validate_login_missing_data():
    """Test login validation with missing data"""
    # Test with None
    assert validate_login(None) == "No data provided"

    # Test with empty dict
    assert validate_login({}) == "Email is required"

    # Test missing password
    data = {"email": "test@example.com"}
    assert validate_login(data) == "Password is required"

    # Test missing email
    data = {"password": "TestPass123"}
    assert validate_login(data) == "Email is required"

def test_validate_login_email():
    """Test login email validation"""
    base_data = {"password": "TestPass123"}

    # Test invalid email formats
    invalid_emails = [
        "test@",
        "@example.com",
        "test@.com",
        "test@com",
        "test.example.com",
        "test@example.",
        "test space@example.com"
    ]
    for email in invalid_emails:
        data = {**base_data, "email": email}
        assert validate_login(data) == "Invalid email format"

    # Test valid email formats
    valid_emails = [
        "test@example.com",
        "test.user@example.com",
        "test+user@example.com",
        "test_user@example.co.uk",
        "test123@example.com"
    ]
    for email in valid_emails:
        data = {**base_data, "email": email}
        assert validate_login(data) is None
