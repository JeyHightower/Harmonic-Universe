from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Dict, Optional
import numpy as np
import soundfile as sf
import io
import time
import requests
from app.core.config import settings
from app.core.auth import get_current_user, require_auth
from app.models.core.user import User
from app.models.core.universe import Universe
from app.models.audio.audio_file import AudioFile
from app.models.audio.audio_track import AudioTrack
from app.models.visualization.visualization import Visualization
from app.models.physics.physics_object import PhysicsObject
from app.models.ai.ai_model import AIModel
from app.services.audio_processing import process_audio_data
from app.db.session import get_db
from app.core.errors import ValidationError, NotFoundError, AuthorizationError

# Create blueprints for different route categories
audio_bp = Blueprint('audio', __name__, url_prefix='/api/v1/audio')
visualization_bp = Blueprint('visualization', __name__, url_prefix='/api/v1/visualization')
physics_bp = Blueprint('physics', __name__, url_prefix='/api/v1/physics')
ai_bp = Blueprint('ai', __name__, url_prefix='/api/v1/ai')

@audio_bp.route('/', methods=['POST'])
@jwt_required()
def upload_audio():
    current_user_id = get_jwt_identity()

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthorizationError('User not found')

        if 'file' not in request.files:
            raise ValidationError('No file part')

        file = request.files['file']
        if file.filename == '':
            raise ValidationError('No selected file')

        # Process and save the audio file
        audio_file = AudioFile(
            filename=file.filename,
            user_id=current_user_id
        )
        audio_file.save(db)

        return jsonify(audio_file.to_dict()), 201

@visualization_bp.route('/', methods=['POST'])
@jwt_required()
def create_visualization():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    with get_db() as db:
        user = User.get_by_id(db, current_user_id)
        if not user:
            raise AuthorizationError('User not found')

        # Validate required fields
        if not all(k in data for k in ('title', 'type', 'audio_file_id')):
            raise ValidationError('Missing required fields')

        # Create visualization
        visualization = Visualization(
            title=data['title'],
            type=data['type'],
            user_id=current_user_id,
            audio_file_id=data['audio_file_id']
        )
        visualization.save(db)

        return jsonify(visualization.to_dict()), 201

@audio_bp.route('/generate-music', methods=['POST'])
@jwt_required()
def generate_music():
    try:
        # Get current user
        current_user = get_current_user()

        # Get request data
        data = request.get_json()
        style = data.get('style')
        mood = data.get('mood')
        parameters = data.get('parameters', {})

        # Validate parameters
        if not style or not mood:
            return jsonify({
                'error': 'Style and mood are required parameters'
            }), 400

        # Initialize audio generation task
        task_id = f"music_gen_{current_user.id}_{int(time.time())}"

        # Start background task for music generation
        current_app.task_queue.enqueue(
            generate_music_task,
            task_id,
            style,
            mood,
            parameters,
            current_user.id
        )

        return jsonify({
            'status': 'processing',
            'message': 'Music generation started',
            'task_id': task_id
        })

    except Exception as e:
        return jsonify({
            'error': f'Error starting music generation: {str(e)}'
        }), 500

@audio_bp.route('/music-status/<task_id>', methods=['GET'])
@jwt_required()
def get_music_status(task_id):
    try:
        # Check task status in cache/database
        status = check_task_status(task_id)
        return jsonify({'status': status})

    except Exception as e:
        return jsonify({
            'error': f'Error checking music generation status: {str(e)}'
        }), 500

@audio_bp.route('/download-music/<task_id>', methods=['GET'])
@jwt_required()
def download_music(task_id):
    try:
        # Get generated audio data
        audio_data = get_generated_audio(task_id)
        if audio_data is None:
            return jsonify({
                'error': 'Generated audio not found'
            }), 404

        # Create in-memory file-like object
        audio_io = io.BytesIO()
        sf.write(audio_io, audio_data, settings.AUDIO_SAMPLE_RATE, format='wav')
        audio_io.seek(0)

        return send_file(
            audio_io,
            mimetype='audio/wav',
            as_attachment=True,
            download_name=f'generated_music_{task_id}.wav'
        )

    except Exception as e:
        return jsonify({
            'error': f'Error downloading generated music: {str(e)}'
        }), 500

def generate_music_task(task_id, style, mood, parameters, user_id):
    try:
        # Call AI music generation service
        response = requests.post(
            settings.AI_MUSIC_SERVICE_URL,
            json={
                'style': style,
                'mood': mood,
                'parameters': parameters
            },
            headers={
                'Authorization': f'Bearer {settings.AI_SERVICE_API_KEY}'
            }
        )

        if response.status_code != 200:
            raise Exception(f'AI service returned status {response.status_code}')

        audio_data = response.content

        # Process the generated audio
        processed_audio = process_audio_data(
            audio_data,
            parameters.get('tempo', 120),
            parameters.get('complexity', 0.5)
        )

        # Store the processed audio
        store_generated_audio(task_id, processed_audio, user_id)

        # Update task status
        update_task_status(task_id, 'completed')

    except Exception as e:
        update_task_status(task_id, 'failed', str(e))
        raise

def check_task_status(task_id: str) -> str:
    # Implementation depends on your task management system
    # This could use Redis, database, or other storage
    pass

def get_generated_audio(task_id: str) -> np.ndarray:
    # Implementation depends on your storage system
    # This could retrieve from file system, S3, or other storage
    pass

def store_generated_audio(task_id: str, audio_data: np.ndarray, user_id: int):
    # Implementation depends on your storage system
    # This could store to file system, S3, or other storage
    pass

def update_task_status(task_id: str, status: str, error_message: Optional[str] = None):
    # Implementation depends on your task management system
    # This could use Redis, database, or other storage
    pass
