
from flask import session, Blueprint, request, jsonify
from models import User, db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data : dict = request.json

        if not data:
            return jsonify({'message': 'Data is needed.'}), 400
        
        email = data.get('email', '').strip().lower()
        username = data.get('username', '').strip().lower()
        
        if User.query.filter_by(username=username).first() or User.query.filter_by(_email=email).first():
            return jsonify({
                'Message': 'User already exists'
            }), 400


        new_user = User(
            name=data.get('name'),
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            bio=data.get('bio')
        )

        db.session.add(new_user)
        db.session.commit()
        session['user_id'] = new_user.user_id  #!creates a session for the user!!

        return jsonify ({
            'Message': f"{new_user.username} with user id of {new_user.user_id} has been successfully created",
            'User': new_user.to_dict()
            }), 201


    except  ValueError as e:
        return jsonify({'Message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG ERROR: {e}")
        return jsonify({'Error': 'Server Error'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username=data.get('username') 
        email=data.get('email')
        password = data.get('password')

        if not password:
            return jsonify({'Message': 'Password is required'}), 400

        user = None
        if not username and not email:
            return jsonify({'Message': 'Username or Email is required'}), 400
        elif not email and username:
            user = User.query.filter_by(username=username.strip().lower()).first()
        elif email and not username:
            user = User.query.filter_by(_email=email.strip().lower()).first()
        else:
            user = User.query.filter_by(_email=email.strip().lower()).first()


        if not user or not user.check_password(password):
            return jsonify({'Message': 'Invalid Credentials'}), 401

        session['user_id'] = user.user_id
        # Remember to pass summary=False if you want to see the bio!
        return jsonify({
                'user': user.to_dict(summary=False),
                'message': 'User successfully logged in'
                }), 200

    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify ({'Message': 'Error occured during login'}), 500


@auth_bp.route('/session-check', methods=['GET'])
def session_check():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({ 'error': 'No active session'}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({
            'Message': 'User not found'
        }), 404
    return jsonify({
        'Message': 'Session found.',
        'user':user.to_dict()}), 200



@auth_bp.route('/logout', methods= ['DELETE'])
def logout():
    session.pop('user_id', None)
    return jsonify({
                'Message': 'Logout Successful'
            }), 200
    

