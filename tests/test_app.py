import unittest
import json
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app

class AppTestCase(unittest.TestCase):
    """Test the Flask application"""

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')

    def test_static_file_serving(self):
        """Test that static files are served correctly"""
        # Create a test file
        os.makedirs('static', exist_ok=True)
        with open('static/test_file.txt', 'w') as f:
            f.write('test content')

        response = self.client.get('/test_file.txt')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'test content')

        # Clean up
        os.remove('static/test_file.txt')

if __name__ == '__main__':
    unittest.main()
