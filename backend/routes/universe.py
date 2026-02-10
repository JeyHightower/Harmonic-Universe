from flask import jsonify, Blueprint, request
from models import Universe, db


universe_bp = Blueprint('universe', __name__, url_prefix='/universes')

@universe_bp.route('/', methods=['POST'])
def create_universe():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'Message': 'Data is required'}), 400
        

    except Exception as e:

    
