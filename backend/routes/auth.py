

@app.route('/register', methods=['POST'])
def register():
    try:
        data : dict = request.json

        if not data:
            return jsonify({'message': 'Data is needed.'}), 400


        new_user = User(
            name=data.get('name'),
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password')
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
        return jsonify({'Error': 'Registration Failed'}), 500


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = User.query.filter_by(username = data.get('username')).first() or User.query.filter_by(email = data.get('email')).first()

        if not user or not user.check_password(data.get('password')):
            return jsonify({'Message': 'Invalid Credentials'}), 401

        session['user_id'] = user.user_id
        return jsonify ({
                'user': user.to_dict(),
                'message': 'User successfully logged in'
                }), 200

    except Exception as e:
        return jsonify ({'Message': 'Error occured during login'}), 500


@app.route('/session-check', methods=['GET'])
def session_check():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({ 'error': 'No active session'}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({
            'Message': 'User not found'
        }), 404
    return jsonify(user.to_dict()), 200



    @app.route('/logout', methods= ['DELETE'])
    def logout():
            session.pop('user_id', None)
            return jsonify({
                'Message': 'Logout Successful'
            }), 200
    

