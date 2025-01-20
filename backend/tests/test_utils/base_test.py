import unittest
import json
from app import create_app
from app.extensions import db

class BaseTest(unittest.TestCase):
    """Base test class with common setup and authentication methods."""

    def setUp(self):
        """Set up test environment."""
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.token = None

    def tearDown(self):
        """Clean up test environment."""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def register_user(self, email='test@example.com', password='testpass123'):
        """Register a test user."""
        return self.client.post('/api/auth/register', json={
            'email': email,
            'password': password
        })

    def login_user(self, email='test@example.com', password='testpass123'):
        """Login a test user and store the token."""
        response = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        if response.status_code == 200:
            data = json.loads(response.data)
            self.token = data['data']['token']
        return response

    def get_auth_headers(self):
        """Get authentication headers with token."""
        if not self.token:
            raise ValueError("No authentication token available. Call login_user first.")
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    def register_and_login(self, email='test@example.com', password='testpass123'):
        """Helper method to register and login a user in one step."""
        self.register_user(email, password)
        self.login_user(email, password)
        return self.get_auth_headers()
