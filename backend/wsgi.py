"""
WSGI entry point for gunicorn
"""
from app import create_app
from app.core.middleware import setup_middleware
from app.core.config import config

# Create the Flask application
app = create_app(config['production'])
# Apply middleware
app = setup_middleware(app)

if __name__ == '__main__':
    app.run()
