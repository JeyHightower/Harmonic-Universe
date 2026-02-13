from flask import Flask
from flask_cors import CORS
from config import Config
from models import db, User, Universe, character_universes, AlignmentType, Character
from routes import auth_bp, universe_bp


app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db.init_app(app)

all_blueprints = [
    (auth_bp, '/auth'),
    (universe_bp, '/universes'),
    (character_bp, '/characters')
]

for bp, prefix in all_blueprints:
    app.register_blueprint(bp, url_prefix=prefix)


if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        # db.create_all()
        # print("Tables have been created!!")
        app.run(debug=True)
