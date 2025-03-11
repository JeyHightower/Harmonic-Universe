import pytest
from app.services.audio_service import AudioService
from app.models import AudioTrack, Scene
from app.exceptions import AudioTrackNotFoundError

def test_create_audio_track(app, test_scene):
    """Test creating an audio track"""
    with app.app_context():
        service = AudioService()
        track = service.create_audio_track(
            name='Test Track',
            track_type='background',
            file_path='/path/to/audio.mp3',
            parameters={
                'volume': 1.0,
                'loop': True,
                'fade_in': 2.0
            },
            scene_id=test_scene.id
        )

        assert track.name == 'Test Track'
        assert track.track_type == 'background'
        assert track.parameters['volume'] == 1.0

def test_get_scene_tracks(app, test_scene):
    """Test retrieving all audio tracks for a scene"""
    with app.app_context():
        service = AudioService()

        # Create multiple tracks
        tracks = [
            service.create_audio_track(
                name=f'Track {i}',
                track_type='background',
                file_path=f'/path/to/audio{i}.mp3',
                parameters={'volume': 1.0},
                scene_id=test_scene.id
            )
            for i in range(3)
        ]

        scene_tracks = service.get_scene_tracks(test_scene.id)
        assert len(scene_tracks) == 3

def test_update_track_parameters(app, test_scene):
    """Test updating audio track parameters"""
    with app.app_context():
        service = AudioService()
        track = service.create_audio_track(
            name='Test Track',
            track_type='background',
            file_path='/path/to/audio.mp3',
            parameters={'volume': 1.0},
            scene_id=test_scene.id
        )

        updated = service.update_track_parameters(
            track.id,
            {'volume': 0.5, 'pan': -0.3}
        )

        assert updated.parameters['volume'] == 0.5
        assert updated.parameters['pan'] == -0.3

def test_delete_track(app, test_scene):
    """Test deleting an audio track"""
    with app.app_context():
        service = AudioService()
        track = service.create_audio_track(
            name='Test Track',
            track_type='background',
            file_path='/path/to/audio.mp3',
            parameters={'volume': 1.0},
            scene_id=test_scene.id
        )

        service.delete_track(track.id)

        with pytest.raises(AudioTrackNotFoundError):
            service.get_track(track.id)

def test_process_audio_file(app, test_scene):
    """Test audio file processing"""
    with app.app_context():
        service = AudioService()

        # Simulate file upload and processing
        processed_file = service.process_audio_file(
            file_path='/path/to/upload.mp3',
            target_format='wav',
            normalize=True
        )

        assert processed_file['format'] == 'wav'
        assert processed_file['normalized'] == True
