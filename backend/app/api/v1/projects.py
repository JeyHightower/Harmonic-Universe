from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.project import Project
from app.models.user import User
from app import db

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    projects = user.projects.all()
    return jsonify([project.to_dict() for project in projects]), 200

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id and not project.is_public:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(project.to_dict()), 200

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    project = Project(
        title=data['title'],
        description=data.get('description', ''),
        is_public=data.get('is_public', False),
        user_id=current_user_id
    )
    project.save()

    return jsonify(project.to_dict()), 201

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    project.update(**{
        'title': data.get('title', project.title),
        'description': data.get('description', project.description),
        'is_public': data.get('is_public', project.is_public)
    })

    return jsonify(project.to_dict()), 200

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    project.delete()
    return '', 204
