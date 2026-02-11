from flask import jsonify, Blueprint, request
from models import Universe, db


universe_bp = Blueprint('universe', __name__, url_prefix='/universes')

@universe_bp.route('/', methods=['POST'])
def create_universe():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'Message': 'Data is required'}), 400
        
        new_universe = Universe(
            name = data.get('name'),
            description = data.get('description'),
            alignment = data.get('alignment')
            )
        
        db.session.add(new_universe)
        db.session.commit()
        return jsonify({
            'Message': 'Universe created successfully',
            'universe': new_universe.to_dict()
            }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            print(f'Message: str{e}')
        }), 400



@universe_bp.route('/', methods=['GET'])
def get_all_universes():

    query = select(Universe)
    universes = db.session.execute(query).scalars().all()

    if not universes:
        return jsonify({
            'Message': 'No universes found'
        }), 404
    return jsonify({
        'Message': 'Universes found', 
        'Universes': [u.to_dict() for u in universes]
    }), 200


@universe_bp.route('/<int:universe_id>', methods=['GET'])
def get_universe(universe_id):
    universe = db.session.get(Universe, universe_id)

    if not universe:
        return jsonify ({
            'Message': 'Universe not found.'
        }), 404
    return jsonify ({
        'Message': f'Universe with id of {universe_id} has been found.',
        'Universe': universe.to_dict()
    }), 200



@universe_bp.route('/<int:universe_id>', methods=['PATCH'])
def update_universe(universe_id):
    universe = db.session.get(Universe, universe_id)
    if not universe:
        return jsonify({
             'Message': 'Universe not found. '
        }), 404
    try:
        data = request.json
        if not data:
            return jsonify({
            'Message':'Invalid data' 
        }), 400


        if 'name' in data:
            if not isinstance(data['name'], str) or not data['name'].strip():
                return jsonify({
                    'Message': 'Name must be a non empty string'
                }), 400
            universe.name = data['name']
        if 'alignment' in data:
            if not isinstance(data['alignment'], str):
                return jsonify({
                    'Message': 'Alignment must be a string'
                }), 400
            try:
                universe.alignment = AlignmentType[data['alignment'].upper()]
            except KeyError:
                return jsonify({
                    'Message': f'Invalid alignment . Valid options: {[e.value for e in AlignmentType]}'
                }), 400
        if 'description' in data:
            if not isinstance(data['description'], str):
                return jsonify({
                    'Message': 'description must be a string'
                }), 400
            if len(data['description']) > 300:
                return jsonify({
                    'Message': 'description is too long and must be  300 characters or less.'
                }), 400
            universe.description = data['description']
        
        db.session.commit()

        return  jsonify ({
            'Message': 'universe has been successfully updated',
            'Universe': universe.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print (f'Error: {str(e)}')
        return jsonify({
            'Message': 'Error occured during the update'
        }), 500




@universe_bp.route('/<int:universe_id>', methods=['DELETE'])
def delete_universe(universe_id):
    universe = db.session.get(Universe, universe_id)
    if not universe:
        return jsonify({
        'Message': 'Universe not found'
    }), 404
    try:
        db.session.delete(universe)
        db.session.commit()
        return jsonify({
            'Message': 'Universe successfully deleted',
            'id': universe_id
        }), 200
    except Exception as e:
        db.session.rollback()
        print (f'Error: {str(e)}')
        return jsonify({
            'Message': 'Error occured'
        }), 500



