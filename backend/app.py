from flask import Flask
from flask_cors import CORS
from config import Config
from models import db, User, Universe, users_universes, AlignmentType


app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db.init_app(app)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Tables have been created!!")
    app.run(debug=True)
