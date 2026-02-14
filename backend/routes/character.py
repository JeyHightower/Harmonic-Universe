from flask import jsonify, Blueprint, request
from models import Character, db, Universe
from sqlalchemy import select


character_bp = Blueprint('characters', __name__, url_prefix='/characters')

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return db.session.get(User, user_id)



# @character_bp.route('/', methods = ['POST'])
# def create_character():