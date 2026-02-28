from flask import Flask
from flask_cors import CORS
from config import Config, db, jwt
from models import TokenBlocklist
# from models import User, Universe, character_universes, AlignmentType, Character, TokenBlocklist, Location, Note, LocationType, character_notes, note_universes, character_locations, location_notes
from routes import auth_bp, universe_bp, character_bp, note_bp, location_bp
# from utils import get_current_user, get_owned_universe_ids, get_request_universe_ids, character_autherization, check_if_token_revoked


app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db.init_app(app)
jwt.init_app(app)

all_blueprints = [
    (auth_bp, '/auth'),
    (universe_bp, '/universes'),
    (character_bp, '/characters'),
    (note_bp, '/notes'),
    (location_bp, '/')
]

for bp, prefix in all_blueprints:
    app.register_blueprint(bp, url_prefix=prefix)


if __name__ == '__main__':
    with app.app_context():
        # TokenBlocklist.query.delete()
        # db.session.commit()
        # print('Blocklist Deleted')
  
        # db.drop_all()
        # print("Tables have been droped!!")
        # db.create_all()
        # print("Tables have been created!!")
        app.run(debug=True)
