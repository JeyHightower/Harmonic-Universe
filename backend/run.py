"""Run the Flask application."""
import os
from app import create_app, socketio

# Set default environment variables if not set
if 'JWT_SECRET_KEY' not in os.environ:
    os.environ['JWT_SECRET_KEY'] = 'dev-jwt-secret-key'
if 'SECRET_KEY' not in os.environ:
    os.environ['SECRET_KEY'] = 'dev-secret-key'
if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = 'sqlite:///dev.db'
if 'REDIS_URL' not in os.environ:
    os.environ['REDIS_URL'] = ''

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
