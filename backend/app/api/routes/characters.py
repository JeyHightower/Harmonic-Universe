from flask import Blueprint

characters_bp = Blueprint('characters', __name__)

@characters_bp.route('/', methods=['GET'])
def get_characters():
    return {'message': 'Characters endpoint'}
