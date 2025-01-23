from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)

# Import routes after app initialization to avoid circular imports
from routes import auth_routes, user_routes

# Register blueprints
app.register_blueprint(auth_routes.bp)
app.register_blueprint(user_routes.bp)

if __name__ == '__main__':
    app.run(debug=True)
