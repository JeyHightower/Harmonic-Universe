import pytest
from flask import url_for
from app.models import User


def test_signup_route(client):
    """Test user signup route"""
    response = client.post(
        "/api/auth/signup",
        json={
            "username": "new_user",
            "email": "new@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201
    assert "token" in response.json


def test_login_route(client, test_user):
    """Test user login route"""
    response = client.post(
        "/api/auth/login", json={"email": test_user.email, "password": "password123"}
    )
    assert response.status_code == 200
    assert "token" in response.json


def test_logout_route(client, auth_headers):
    """Test user logout route"""
    response = client.post("/api/auth/logout", headers=auth_headers)
    assert response.status_code == 200


def test_me_route(client, auth_headers, test_user):
    """Test current user info route"""
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json["email"] == test_user.email
