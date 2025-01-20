import os
import sys

# Add the application root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set testing environment variable
os.environ['FLASK_ENV'] = 'testing'
