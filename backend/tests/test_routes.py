import unittest
import json
from app import create_app
from app.extensions import db

class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.token = None

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def register_user(self):
        return self.client.post('/api/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123'
        })

    def login_user(self):
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'password123'
        })
        data = json.loads(response.data)
        self.token = data.get('token')
        return response

    def test_auth_flow(self):
        # Test registration
        response = self.register_user()
        self.assertEqual(response.status_code, 201)

        # Test login
        response = self.login_user()
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', json.loads(response.data))

    def test_universe_crud(self):
        self.register_user()
        self.login_user()
        headers = {'Authorization': f'Bearer {self.token}'}

        # Create universe
        response = self.client.post('/api/universes', json={
            'name': 'Test Universe',
            'description': 'Test Description'
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        universe_id = json.loads(response.data)['id']

        # Get universe
        response = self.client.get(f'/api/universes/{universe_id}', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Update universe
        response = self.client.put(f'/api/universes/{universe_id}', json={
            'name': 'Updated Universe'
        }, headers=headers)
        self.assertEqual(response.status_code, 200)

        # Delete universe
        response = self.client.delete(f'/api/universes/{universe_id}', headers=headers)
        self.assertEqual(response.status_code, 200)

    def test_comments(self):
        self.register_user()
        self.login_user()
        headers = {'Authorization': f'Bearer {self.token}'}

        # Create universe first
        response = self.client.post('/api/universes', json={
            'name': 'Test Universe'
        }, headers=headers)
        universe_id = json.loads(response.data)['id']

        # Create comment
        response = self.client.post(f'/api/comments/{universe_id}', json={
            'content': 'Test Comment'
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        comment_id = json.loads(response.data)['id']

        # Get comments
        response = self.client.get(f'/api/comments/{universe_id}', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Update comment
        response = self.client.put(f'/api/comments/{comment_id}', json={
            'content': 'Updated Comment'
        }, headers=headers)
        self.assertEqual(response.status_code, 200)

        # Delete comment
        response = self.client.delete(f'/api/comments/{comment_id}', headers=headers)
        self.assertEqual(response.status_code, 200)

    def test_favorites(self):
        self.register_user()
        self.login_user()
        headers = {'Authorization': f'Bearer {self.token}'}

        # Create universe first
        response = self.client.post('/api/universes', json={
            'name': 'Test Universe'
        }, headers=headers)
        universe_id = json.loads(response.data)['id']

        # Add favorite
        response = self.client.post(f'/api/favorites/universes/{universe_id}/favorite', headers=headers)
        self.assertEqual(response.status_code, 201)

        # Get favorites
        response = self.client.get('/api/favorites/favorites', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Remove favorite
        response = self.client.delete(f'/api/favorites/universes/{universe_id}/favorite', headers=headers)
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
