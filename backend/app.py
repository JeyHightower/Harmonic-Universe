from flask import Flask
from flask_cors import CORS
from config import Config, db, jwt
from models import TokenBlocklist
from seed import demo_seed_data
from routes import auth_bp, universe_bp, character_bp, note_bp, location_bp, user_bp


app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins=["https://harmonic-universe-2.onrender.com"])
db.init_app(app)
jwt.init_app(app)



all_blueprints = [
    (auth_bp, '/api/auth'),
    (universe_bp, '/api/universes'),
    (character_bp, '/api/characters'),
    (note_bp, '/api/notes'),
    (location_bp, '/api/'),
    (user_bp, '/api/users')
]

for bp, prefix in all_blueprints:
    app.register_blueprint(bp, url_prefix=prefix)


with app.app_context():
    db.create_all()
    print("Database tables checked/created successfully!")

    from models import User
    try:
        if User.query.count() == 0:
            demo_seed_data()
            print("Demo seed data created successfully!")
        else:
            print("Database already contains data. Skipping seeding.")
    except Exception as e:
        print(f"seeding skipped or encountered an error: {e}")
        
if __name__ == '__main__':
    app.run(debug=True)
        
