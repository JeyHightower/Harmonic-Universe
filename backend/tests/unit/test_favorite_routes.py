import unittest
import json
from app import create_app
from app.extensions import db
from tests.test_utils import BaseTest

class TestFavoriteRoutes(BaseTest):
    def test_favorites(self):
        headers = self.register_and_login()

        # Create universe first
        response = self.client.post('/api/universes', json={
            'title': 'Test Universe',
            'is_public': True
        }, headers=headers)
        data = json.loads(response.data)
        universe_id = data['data']['universe']['id']

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
