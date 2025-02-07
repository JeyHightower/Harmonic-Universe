import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models.audio_file import AudioFile
from app.models.project import Project
from app import db

audio_bp = Blueprint('audio', __name__)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@audio_bp.route('/project/<int:project_id>/audio', methods=['POST'])
@jwt_required()
def upload_audio(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    audio_file = AudioFile(
        filename=filename,
        file_path=file_path,
        file_type=filename.rsplit('.', 1)[1].lower(),
        user_id=current_user_id,
        project_id=project_id
    )
    audio_file.save()

    return jsonify(audio_file.to_dict()), 201

@audio_bp.route('/project/<int:project_id>/audio', methods=['GET'])
@jwt_required()
def get_project_audio_files(project_id):
    current_user_id = get_jwt_identity()
    project = Project.query.get_or_404(project_id)

    if project.user_id != current_user_id and not project.is_public:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify([audio.to_dict() for audio in project.audio_files]), 200

@audio_bp.route('/audio/<int:audio_id>', methods=['GET'])
@jwt_required()
def get_audio_file(audio_id):
    current_user_id = get_jwt_identity()
    audio_file = AudioFile.query.get_or_404(audio_id)

    if audio_file.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return send_file(audio_file.file_path)

@audio_bp.route('/audio/<int:audio_id>', methods=['DELETE'])
@jwt_required()
def delete_audio_file(audio_id):
    current_user_id = get_jwt_identity()
    audio_file = AudioFile.query.get_or_404(audio_id)

    if audio_file.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        os.remove(audio_file.file_path)
    except OSError:
        pass

    audio_file.delete()
    return '', 204
