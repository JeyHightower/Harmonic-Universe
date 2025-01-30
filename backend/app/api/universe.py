"""Universe API endpoints.

This module provides REST API endpoints for managing universes,
including CRUD operations and sharing functionality.
"""
# Flask imports
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity

# Models
from app.models import Universe, User
from app import db


api = Namespace('universes', description='Universe operations')


# Models for request/response documentation
universe_model = api.model(
    'Universe',
    {
        'id': fields.Integer(
            readonly=True,
            description='The universe identifier'
        ),
        'name': fields.String(
            required=True,
            description='The universe name'
        ),
        'description': fields.String(
            required=True,
            description='The universe description'
        ),
        'created_at': fields.DateTime(
            readonly=True,
            description='Creation timestamp'
        ),
        'updated_at': fields.DateTime(
            readonly=True,
            description='Last update timestamp'
        ),
        'owner_id': fields.Integer(
            readonly=True,
            description='Universe owner ID'
        ),
        'is_public': fields.Boolean(
            description='Universe visibility status'
        )
    }
)

universe_create_model = api.model(
    'UniverseCreate',
    {
        'name': fields.String(
            required=True,
            description='The universe name'
        ),
        'description': fields.String(
            required=True,
            description='The universe description'
        ),
        'is_public': fields.Boolean(
            default=False,
            description='Universe visibility status'
        )
    }
)

universe_update_model = api.model(
    'UniverseUpdate',
    {
        'name': fields.String(
            description='The universe name'
        ),
        'description': fields.String(
            description='The universe description'
        ),
        'is_public': fields.Boolean(
            description='Universe visibility status'
        )
    }
)


@api.route('/')
class UniverseList(Resource):
    """Resource for managing universe collections."""

    @api.doc(
        'list_universes',
        security='Bearer',
        params={
            'page': {
                'in': 'query',
                'description': 'Page number',
                'default': 1
            },
            'per_page': {
                'in': 'query',
                'description': 'Items per page',
                'default': 10
            }
        }
    )
    @api.marshal_list_with(universe_model)
    @jwt_required()
    def get(self):
        """List all accessible universes."""
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 100)

        # Query universes user has access to
        query = Universe.query.filter(
            (Universe.owner_id == user_id) |
            (Universe.is_public.is_(True))
        )

        return query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        ).items

    @api.doc('create_universe', security='Bearer')
    @api.expect(universe_create_model)
    @api.marshal_with(universe_model, code=201)
    @jwt_required()
    def post(self):
        """Create a new universe."""
        user_id = get_jwt_identity()
        data = api.payload

        universe = Universe(
            name=data['name'],
            description=data['description'],
            is_public=data.get('is_public', False),
            owner_id=user_id
        )

        db.session.add(universe)
        db.session.commit()

        return universe, 201


@api.route('/<int:id>')
@api.param('id', 'The universe identifier')
@api.response(404, 'Universe not found')
class UniverseResource(Resource):
    """Resource for managing individual universes."""

    @api.doc('get_universe', security='Bearer')
    @api.marshal_with(universe_model)
    @jwt_required()
    def get(self, id):
        """Fetch a universe by ID."""
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if not universe.is_public and universe.owner_id != user_id:
            api.abort(403, "Not authorized to view this universe")

        return universe

    @api.doc('update_universe', security='Bearer')
    @api.expect(universe_update_model)
    @api.marshal_with(universe_model)
    @jwt_required()
    def put(self, id):
        """Update a universe."""
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if universe.owner_id != user_id:
            api.abort(403, "Not authorized to modify this universe")

        data = api.payload
        if 'name' in data:
            universe.name = data['name']
        if 'description' in data:
            universe.description = data['description']
        if 'is_public' in data:
            universe.is_public = data['is_public']

        db.session.commit()
        return universe

    @api.doc('delete_universe', security='Bearer')
    @api.response(204, 'Universe deleted')
    @jwt_required()
    def delete(self, id):
        """Delete a universe."""
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if universe.owner_id != user_id:
            api.abort(403, "Not authorized to delete this universe")

        db.session.delete(universe)
        db.session.commit()
        return '', 204


@api.route('/<int:id>/share')
@api.param('id', 'The universe identifier')
class UniverseShare(Resource):
    """Resource for managing universe sharing."""

    share_model = api.model('Share', {
        'user_id': fields.Integer(
            required=True,
            description='User ID to share with'
        ),
        'permission': fields.String(
            required=True,
            enum=['read', 'write'],
            description='Permission level'
        )
    })

    @api.doc('share_universe', security='Bearer')
    @api.expect(share_model)
    @api.response(200, 'Universe shared successfully')
    @jwt_required()
    def post(self, id):
        """Share a universe with another user."""
        user_id = get_jwt_identity()
        universe = Universe.query.get_or_404(id)

        if universe.owner_id != user_id:
            api.abort(403, "Not authorized to share this universe")

        data = api.payload
        target_user = User.query.get_or_404(data['user_id'])

        # Add share logic here
        # This would typically involve creating a record in a share/access table

        return {'message': 'Universe shared successfully'}
