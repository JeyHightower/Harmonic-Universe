from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.visualization import Visualization
from app.models.audio_file import AudioFile
from app.models.project import Project
from app import db

viz_bp = Blueprint('visualizations', __name__)

@viz_bp.route('/project/<int:project_id>/audio/<int:audio_id>/visualizations', methods=['POST'])
@jwt_required()
def create_visualization(project_id, audio_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)
    audio_file = AudioFile.query.get_or_404(audio_id)

    if project.user_id != current_user_id or audio_file.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    visualization = Visualization(
        title=data['title'],
        type=data['type'],
        settings=data.get('settings', {}),
        user_id=current_user_id,
        project_id=project_id,
        audio_file_id=audio_id
    )
    visualization.save()

    return jsonify(visualization.to_dict()), 201

@viz_bp.route('/project/<int:project_id>/visualizations', methods=['GET'])
@jwt_required()
def get_project_visualizations(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id and not project.is_public:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify([viz.to_dict() for viz in project.visualizations]), 200

@viz_bp.route('/audio/<int:audio_id>/visualizations', methods=['GET'])
@jwt_required()
def get_audio_visualizations(audio_id):
    current_user_id = get_jwt_identity()
    audio_file = AudioFile.query.get_or_404(audio_id)

    if audio_file.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify([viz.to_dict() for viz in audio_file.visualizations]), 200

@viz_bp.route('/visualizations/<int:viz_id>', methods=['GET'])
@jwt_required()
def get_visualization(viz_id):
    current_user_id = get_jwt_identity()
    visualization = Visualization.query.get_or_404(viz_id)

    if visualization.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(visualization.to_dict()), 200

@viz_bp.route('/visualizations/<int:viz_id>', methods=['PUT'])
@jwt_required()
def update_visualization(viz_id):
    current_user_id = get_jwt_identity()
    visualization = Visualization.query.get_or_404(viz_id)

    if visualization.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    visualization.update(**{
        'title': data.get('title', visualization.title),
        'type': data.get('type', visualization.type),
        'settings': data.get('settings', visualization.settings)
    })

    return jsonify(visualization.to_dict()), 200

@viz_bp.route('/visualizations/<int:viz_id>', methods=['DELETE'])
@jwt_required()
def delete_visualization(viz_id):
    current_user_id = get_jwt_identity()
    visualization = Visualization.query.get_or_404(viz_id)

    if visualization.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    visualization.delete()
    return '', 204
