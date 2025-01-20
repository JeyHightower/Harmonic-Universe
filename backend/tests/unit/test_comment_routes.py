import unittest
import json
from app import create_app
from app.extensions import db
from tests.test_utils import BaseTest

class TestCommentRoutes(BaseTest):
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

    def register_and_login(self):
        # Register user
        self.client.post('/api/auth/register', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })

        # Login user
        response = self.client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'testpass123'
        })
        data = json.loads(response.data)
        self.token = data['data']['token']
        return {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}

    def test_comment_crud(self):
        headers = self.register_and_login()

        # Create universe first
        response = self.client.post('/api/universes', json={
            'title': 'Test Universe',
            'is_public': True
        }, headers=headers)
        data = json.loads(response.data)
        universe_id = data['data']['universe']['id']

        # Create comment
        response = self.client.post(f'/api/comments/{universe_id}', json={
            'content': 'Test Comment'
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        comment_id = data['id']

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

if __name__ == '__main__':
    unittest.main()
