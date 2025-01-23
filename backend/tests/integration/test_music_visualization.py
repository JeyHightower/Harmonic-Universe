import pytest
from flask_socketio import SocketIOTestClient
from app import create_app
from app.extensions import db
from app.models.base import User, Universe, MusicParameters, VisualizationParameters
import numpy as np
from ..config import TestConfig

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_user(app):
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def test_universe(app, test_user):
    universe = Universe(
        name='Test Universe',
        description='Test Description',
        user_id=test_user.id,
        is_public=True
    )
    db.session.add(universe)
    db.session.commit()

    # Add default parameters
    music = MusicParameters(
        universe_id=universe.id,
        harmony=0.5,
        tempo=120,
        key='C',
        scale='major'
    )
    visualization = VisualizationParameters(
        universe_id=universe.id,
        brightness=0.8,
        saturation=0.7,
        complexity=0.5,
        color_scheme='rainbow'
    )
    db.session.add_all([music, visualization])
    db.session.commit()
    return universe

@pytest.fixture
def socketio_client(app):
    return SocketIOTestClient(app, app.websocket_manager.socketio)

def test_music_generation_basic(socketio_client, test_universe):
    """Test basic music generation."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Request music generation
    socketio_client.emit('music_generation', {
        'duration': 30,
        'start_time': 0
    })

    # Verify response
    received = socketio_client.get_received()
    music_msg = next(msg for msg in received if msg['name'] == 'music_update')
    notes = music_msg['args'][0]['notes']

    assert isinstance(notes, list)
    assert len(notes) > 0
    for note in notes:
        assert all(key in note for key in ['pitch', 'start', 'duration', 'velocity'])
        assert 0 <= note['pitch'] <= 127  # MIDI pitch range
        assert note['start'] >= 0
        assert note['duration'] > 0
        assert 0 <= note['velocity'] <= 127  # MIDI velocity range

def test_music_generation_parameters(socketio_client, test_universe):
    """Test music generation with different parameters."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Update music parameters
    socketio_client.emit('parameter_update', {
        'parameters': {
            'music': {
                'harmony': 0.8,
                'tempo': 160,
                'key': 'G',
                'scale': 'minor'
            }
        }
    })
    socketio_client.get_received()

    # Request music generation
    socketio_client.emit('music_generation', {
        'duration': 30,
        'start_time': 0
    })

    # Verify response reflects parameters
    received = socketio_client.get_received()
    music_msg = next(msg for msg in received if msg['name'] == 'music_update')
    notes = music_msg['args'][0]['notes']

    # Verify tempo influence
    note_times = [note['start'] for note in notes]
    average_interval = np.mean(np.diff(sorted(note_times)))
    assert average_interval < 0.5  # Faster tempo should have shorter intervals

def test_visualization_basic(socketio_client, test_universe):
    """Test basic visualization generation."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Request visualization
    socketio_client.emit('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high'
    })

    # Verify response
    received = socketio_client.get_received()
    visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
    data = visual_msg['args'][0]

    assert 'particles' in data
    assert len(data['particles']) > 0
    for particle in data['particles']:
        assert all(key in particle for key in ['x', 'y', 'size', 'color'])
        assert 0 <= particle['x'] <= 800
        assert 0 <= particle['y'] <= 600
        assert particle['size'] > 0
        assert particle['color'].startswith('#')

def test_visualization_parameters(socketio_client, test_universe):
    """Test visualization with different parameters."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Update visualization parameters
    socketio_client.emit('parameter_update', {
        'parameters': {
            'visualization': {
                'brightness': 1.0,
                'saturation': 1.0,
                'complexity': 0.8,
                'color_scheme': 'monochrome'
            }
        }
    })
    socketio_client.get_received()

    # Request visualization
    socketio_client.emit('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high'
    })

    # Verify response reflects parameters
    received = socketio_client.get_received()
    visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
    data = visual_msg['args'][0]

    # Check color scheme
    colors = set(particle['color'] for particle in data['particles'])
    assert len(colors) < 10  # Monochrome should have fewer unique colors

def test_music_visualization_sync(socketio_client, test_universe):
    """Test synchronization between music and visualization."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Generate music
    socketio_client.emit('music_generation', {
        'duration': 30,
        'start_time': 0
    })
    music_received = socketio_client.get_received()
    music_msg = next(msg for msg in music_received if msg['name'] == 'music_update')
    notes = music_msg['args'][0]['notes']

    # Request visualization with music data
    socketio_client.emit('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high',
        'music_data': notes
    })

    # Verify visualization responds to music
    received = socketio_client.get_received()
    visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
    particles = visual_msg['args'][0]['particles']

    # There should be some correlation between note events and particle properties
    note_times = set(note['start'] for note in notes)
    particle_times = set(particle.get('creation_time', 0) for particle in particles)
    assert len(note_times.intersection(particle_times)) > 0

def test_quality_settings(socketio_client, test_universe):
    """Test different quality settings for visualization."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    quality_tests = ['low', 'medium', 'high']
    particle_counts = []

    for quality in quality_tests:
        socketio_client.emit('visualization_update', {
            'width': 800,
            'height': 600,
            'quality': quality
        })
        received = socketio_client.get_received()
        visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
        particles = visual_msg['args'][0]['particles']
        particle_counts.append(len(particles))

    # Higher quality should have more particles
    assert particle_counts[0] < particle_counts[1] < particle_counts[2]

def test_audio_analysis_integration(socketio_client, test_universe):
    """Test integration of audio analysis with visualization."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    # Send audio analysis data
    analysis_data = {
        'frequencies': {
            'bass': 0.8,
            'mid': 0.6,
            'high': 0.4
        }
    }
    socketio_client.emit('audio_analysis', analysis_data)

    # Request visualization
    socketio_client.emit('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high'
    })

    # Verify visualization responds to audio analysis
    received = socketio_client.get_received()
    visual_msg = next(msg for msg in received if msg['name'] == 'visualization_update')
    particles = visual_msg['args'][0]['particles']

    # Check for frequency influence on particles
    bass_particles = [p for p in particles if p['size'] > 20]  # Larger particles for bass
    assert len(bass_particles) > 0

def test_performance_metrics(socketio_client, test_universe):
    """Test performance metrics for music and visualization generation."""
    # Join room
    socketio_client.emit('join_room', {
        'universe_id': test_universe.id,
        'mode': 'edit'
    })
    socketio_client.get_received()

    import time

    # Measure music generation time
    start_time = time.time()
    socketio_client.emit('music_generation', {
        'duration': 30,
        'start_time': 0
    })
    socketio_client.get_received()
    music_time = time.time() - start_time

    # Measure visualization generation time
    start_time = time.time()
    socketio_client.emit('visualization_update', {
        'width': 800,
        'height': 600,
        'quality': 'high'
    })
    socketio_client.get_received()
    visual_time = time.time() - start_time

    # Performance thresholds
    assert music_time < 1.0  # Music generation should take less than 1 second
    assert visual_time < 0.5  # Visualization should take less than 0.5 seconds
