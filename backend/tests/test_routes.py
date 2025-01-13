import unittest
import json
from app import create_app, db
from app.models.user import User
from app.models.universe import Universe
from app.models.storyboard import Storyboard
from app.models.physics_parameter import PhysicsParameter
from app.models.music_parameter import MusicParameter
from config import TestConfig

class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Create test user
        user = User(
            username='testuser',
            email='test@example.com'
        )
        user.set_password('testpass123')
        db.session.add(user)
        db.session.commit()

        # Test user data for login
        self.test_user = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }

        # Store tokens and IDs for tests
        self.auth_token = None
        self.universe_id = None
        self.storyboard_id = None
        self.physics_param_id = None
        self.music_param_id = None

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_1_auth_routes(self):
        """Test authentication routes"""
        # Test signup
        signup_user = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123'
        }
        response = self.client.post('/api/auth/signup',
                                  json=signup_user)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('token', data)

        # Test login
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.auth_token = data['token']

        # Test token validation
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response = self.client.get('/api/auth/validate', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test token refresh
        response = self.client.post('/api/auth/token/refresh', headers=headers)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.auth_token = data['token']  # Update token for subsequent tests

    def test_2_universe_routes(self):
        """Test universe management routes"""
        # First authenticate
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.auth_token = json.loads(response.data)['token']
        headers = {'Authorization': f'Bearer {self.auth_token}'}

        # Test universe creation
        universe_data = {
            'name': 'Test Universe',
            'description': 'A test universe',
            'gravity_constant': 10.0,
            'environment_harmony': 0.8
        }
        response = self.client.post('/api/universes/',
                                  json=universe_data,
                                  headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.universe_id = data['universe']['id']

        # Test get all universes
        response = self.client.get('/api/universes/', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test get specific universe
        response = self.client.get(f'/api/universes/{self.universe_id}',
                                 headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test update universe
        update_data = {'name': 'Updated Universe'}
        response = self.client.put(f'/api/universes/{self.universe_id}',
                                 json=update_data,
                                 headers=headers)
        self.assertEqual(response.status_code, 200)

    def test_3_storyboard_routes(self):
        """Test storyboard routes"""
        # First authenticate
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.auth_token = json.loads(response.data)['token']
        headers = {'Authorization': f'Bearer {self.auth_token}'}

        # Create a universe first
        universe_data = {
            'name': 'Story Universe',
            'description': 'For testing storyboards'
        }
        response = self.client.post('/api/universes/',
                                  json=universe_data,
                                  headers=headers)
        self.universe_id = json.loads(response.data)['universe']['id']

        # Test storyboard creation
        storyboard_data = {
            'plot_point': 'Test Story',
            'description': 'Once upon a time...',
            'harmony_tie': 0.8
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/storyboards/',
                                  json=storyboard_data,
                                  headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.storyboard_id = data['storyboard']['id']

        # Test get all storyboards
        response = self.client.get(f'/api/universes/{self.universe_id}/storyboards/',
                                 headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test update storyboard
        update_data = {'plot_point': 'Updated Story',
                      'description': 'Once upon a time...',
                      'harmony_tie': 0.8}
        response = self.client.put(
            f'/api/universes/{self.universe_id}/storyboards/{self.storyboard_id}',
            json=update_data,
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    def test_4_physics_routes(self):
        """Test physics parameter routes"""
        # First authenticate
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.auth_token = json.loads(response.data)['token']
        headers = {'Authorization': f'Bearer {self.auth_token}'}

        # Create a universe first
        universe_data = {
            'name': 'Physics Universe',
            'description': 'For testing physics'
        }
        response = self.client.post('/api/universes/',
                                  json=universe_data,
                                  headers=headers)
        self.universe_id = json.loads(response.data)['universe']['id']

        # Test physics parameter creation
        physics_data = {
            'parameter_name': 'Light Speed',
            'value': 299792458,
            'unit': 'm/s'
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/physics/',
                                  json=physics_data,
                                  headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.physics_param_id = data['parameter']['id']

        # Test get all physics parameters
        response = self.client.get(f'/api/universes/{self.universe_id}/physics/',
                                 headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test update physics parameter
        update_data = {
            'parameter_name': 'Light Speed',
            'value': 299792460,
            'unit': 'm/s'
        }
        response = self.client.put(
            f'/api/universes/{self.universe_id}/physics/{self.physics_param_id}',
            json=update_data,
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    def test_5_music_routes(self):
        """Test music parameter routes"""
        # First authenticate
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.auth_token = json.loads(response.data)['token']
        headers = {'Authorization': f'Bearer {self.auth_token}'}

        # Create a universe first
        universe_data = {
            'name': 'Music Universe',
            'description': 'For testing music'
        }
        response = self.client.post('/api/universes/',
                                  json=universe_data,
                                  headers=headers)
        self.universe_id = json.loads(response.data)['universe']['id']

        # Test music parameter creation
        music_data = {
            'parameter_name': 'Tempo',
            'value': 120,
            'instrument': 'piano'
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/music/',
                                  json=music_data,
                                  headers=headers)
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.music_param_id = data['parameter']['id']

        # Test get all music parameters
        response = self.client.get(f'/api/universes/{self.universe_id}/music/',
                                 headers=headers)
        self.assertEqual(response.status_code, 200)

        # Test update music parameter
        update_data = {
            'parameter_name': 'Tempo',
            'value': 140,
            'instrument': 'violin'
        }
        response = self.client.put(
            f'/api/universes/{self.universe_id}/music/{self.music_param_id}',
            json=update_data,
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

    def test_6_deletion_routes(self):
        """Test deletion routes in reverse order of creation"""
        # First authenticate
        response = self.client.post('/api/auth/login',
                                  json={'email': self.test_user['email'],
                                       'password': self.test_user['password']})
        self.auth_token = json.loads(response.data)['token']
        headers = {'Authorization': f'Bearer {self.auth_token}'}

        # Create test data first
        # Create universe
        universe_data = {'name': 'Delete Test Universe'}
        response = self.client.post('/api/universes/',
                                  json=universe_data,
                                  headers=headers)
        self.universe_id = json.loads(response.data)['universe']['id']

        # Create storyboard
        storyboard_data = {
            'plot_point': 'Delete Test Story',
            'description': 'For deletion',
            'harmony_tie': 0.5
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/storyboards/',
                                  json=storyboard_data,
                                  headers=headers)
        self.storyboard_id = json.loads(response.data)['storyboard']['id']

        # Create physics parameter
        physics_data = {
            'parameter_name': 'Delete Test Physics',
            'value': 1.0,
            'unit': 'test'
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/physics/',
                                  json=physics_data,
                                  headers=headers)
        self.physics_param_id = json.loads(response.data)['parameter']['id']

        # Create music parameter
        music_data = {
            'parameter_name': 'Delete Test Music',
            'value': 1.0,
            'instrument': 'test'
        }
        response = self.client.post(f'/api/universes/{self.universe_id}/music/',
                                  json=music_data,
                                  headers=headers)
        self.music_param_id = json.loads(response.data)['parameter']['id']

        # Now test deletion in reverse order
        # Delete music parameter
        response = self.client.delete(
            f'/api/universes/{self.universe_id}/music/{self.music_param_id}',
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

        # Delete physics parameter
        response = self.client.delete(
            f'/api/universes/{self.universe_id}/physics/{self.physics_param_id}',
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

        # Delete storyboard
        response = self.client.delete(
            f'/api/universes/{self.universe_id}/storyboards/{self.storyboard_id}',
            headers=headers
        )
        self.assertEqual(response.status_code, 200)

        # Delete universe
        response = self.client.delete(f'/api/universes/{self.universe_id}',
                                    headers=headers)
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
