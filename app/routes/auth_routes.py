@auth_bp.route('/me', methods=['GET'])
@jwt_required()
@limiter.limit("30 per minute")
def get_current_user():
    try:
        user_id = get_jwt_identity()
        print(f"Debug: User ID from token: {user_id}")

        user = User.query.get(user_id)
        print(f"Debug: User object: {user}")

        if not user:
            print("Debug: User not found in database")
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        user_dict = user.to_dict()
        print(f"Debug: User dict: {user_dict}")

        return jsonify({
            'status': 'success',
            'data': {
                'user': user_dict
            }
        }), 200

    except Exception as e:
        print(f"Debug: Error in get_current_user: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
