from flask_restx import Api
from flask import Blueprint

# Create Blueprint for API
api_bp = Blueprint('api', __name__)

# Initialize API with blueprint
api = Api(
    api_bp,
    title='Harmonic Universe API',
    version='1.0',
    description='API for Harmonic Universe application',
    doc='/docs',
    authorizations={
        'Bearer': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Type in the *\'Value\'* input box below: **\'Bearer &lt;JWT&gt;\'**, where JWT is the token'
        }
    }
)

# Import namespaces
from .auth import api as auth_ns
from .profile import api as profile_ns
from .universe import api as universe_ns
from .websocket import api as websocket_ns

# Add namespaces
api.add_namespace(auth_ns, path='/auth')
api.add_namespace(profile_ns, path='/profile')
api.add_namespace(universe_ns, path='/universes')
api.add_namespace(websocket_ns, path='/ws')
