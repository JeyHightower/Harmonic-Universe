from flask import Blueprint

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/', methods=['GET'])
def get_notes():
    return {'message': 'Notes endpoint'}
