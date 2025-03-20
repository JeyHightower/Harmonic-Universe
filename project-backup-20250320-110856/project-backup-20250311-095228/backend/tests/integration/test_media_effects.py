"""Test suite for media effects functionality."""
import pytest
from app.models import VisualEffect, AudioTrack
from app.media import EffectProcessor, AudioProcessor
from .factories import SceneFactory, VisualEffectFactory, AudioTrackFactory


def test_visual_effect_creation(client, scene, auth_headers):
    """Test visual effect creation."""
    response = client.post(
        f"/api/scenes/{scene.id}/visual-effects",
        json={
            "name": "Fade In",
            "effect_type": "fade",
            "parameters": {
                "duration": 1.0,
                "start_opacity": 0,
                "end_opacity": 1,
                "easing": "ease-in-out",
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["name"] == "Fade In"
    assert response.json["effect_type"] == "fade"

    effect = VisualEffect.query.get(response.json["id"])
    assert effect is not None
    assert effect.parameters["duration"] == 1.0


def test_audio_track_creation(client, scene, auth_headers):
    """Test audio track creation."""
    response = client.post(
        f"/api/scenes/{scene.id}/audio-tracks",
        json={
            "name": "Background Music",
            "track_type": "background",
            "parameters": {
                "volume": 0.8,
                "loop": True,
                "start_time": 0,
                "fade_in": 2.0,
                "fade_out": 1.5,
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json["name"] == "Background Music"
    assert response.json["track_type"] == "background"

    track = AudioTrack.query.get(response.json["id"])
    assert track is not None
    assert track.parameters["volume"] == 0.8


def test_visual_effect_processing(scene):
    """Test visual effect processing."""
    processor = EffectProcessor()

    # Create a fade effect
    effect = VisualEffectFactory(
        scene=scene,
        effect_type="fade",
        parameters={
            "duration": 1.0,
            "start_opacity": 0,
            "end_opacity": 1,
            "easing": "linear",
        },
    )

    # Process effect at different times
    state_start = processor.process_effect(effect, 0)
    assert state_start["opacity"] == 0

    state_middle = processor.process_effect(effect, 0.5)
    assert state_middle["opacity"] == 0.5

    state_end = processor.process_effect(effect, 1.0)
    assert state_end["opacity"] == 1


def test_audio_processing(scene):
    """Test audio processing."""
    processor = AudioProcessor()

    # Create an audio track with fade
    track = AudioTrackFactory(
        scene=scene,
        track_type="background",
        parameters={"volume": 0.8, "fade_in": 2.0, "fade_out": 1.5, "duration": 10.0},
    )

    # Test volume at different times
    volume_start = processor.get_volume(track, 0)
    assert volume_start == 0  # Should start silent

    volume_after_fade = processor.get_volume(track, 2.0)
    assert volume_after_fade == 0.8  # Should be at full volume

    volume_during_fade_out = processor.get_volume(track, 9.0)
    assert 0 < volume_during_fade_out < 0.8  # Should be fading out


def test_effect_chaining(scene):
    """Test chaining multiple effects."""
    processor = EffectProcessor()

    # Create multiple effects
    fade_in = VisualEffectFactory(
        scene=scene,
        effect_type="fade",
        parameters={"duration": 1.0, "start_opacity": 0, "end_opacity": 1},
    )
    scale = VisualEffectFactory(
        scene=scene,
        effect_type="scale",
        parameters={"duration": 1.0, "start_scale": 1.0, "end_scale": 2.0},
    )

    # Process combined effects
    state = processor.process_effects([fade_in, scale], 0.5)
    assert state["opacity"] == 0.5
    assert state["scale"] == 1.5


def test_effect_timing(scene):
    """Test effect timing and synchronization."""
    processor = EffectProcessor()

    # Create effect with delay
    effect = VisualEffectFactory(
        scene=scene,
        effect_type="move",
        parameters={
            "delay": 1.0,
            "duration": 2.0,
            "start_position": {"x": 0, "y": 0},
            "end_position": {"x": 100, "y": 0},
        },
    )

    # Test before delay
    state_before = processor.process_effect(effect, 0.5)
    assert state_before["position"] == {"x": 0, "y": 0}

    # Test during effect
    state_during = processor.process_effect(effect, 2.0)
    assert state_during["position"]["x"] == 50  # Should be halfway

    # Test after effect
    state_after = processor.process_effect(effect, 4.0)
    assert state_after["position"] == {"x": 100, "y": 0}


def test_audio_mixing(scene):
    """Test audio track mixing."""
    processor = AudioProcessor()

    # Create multiple tracks
    background = AudioTrackFactory(
        scene=scene, track_type="background", parameters={"volume": 0.5}
    )
    sound_effect = AudioTrackFactory(
        scene=scene, track_type="effect", parameters={"volume": 1.0}
    )

    # Mix tracks
    mixed_state = processor.mix_tracks([background, sound_effect])
    assert mixed_state["master_volume"] <= 1.0  # Should not clip
    assert "tracks" in mixed_state
    assert len(mixed_state["tracks"]) == 2


def test_effect_easing(scene):
    """Test effect easing functions."""
    processor = EffectProcessor()

    # Create effect with different easing
    effect = VisualEffectFactory(
        scene=scene,
        effect_type="fade",
        parameters={
            "duration": 1.0,
            "start_opacity": 0,
            "end_opacity": 1,
            "easing": "ease-in-out",
        },
    )

    # Test easing curve
    state_25 = processor.process_effect(effect, 0.25)
    state_50 = processor.process_effect(effect, 0.50)
    state_75 = processor.process_effect(effect, 0.75)

    # Verify non-linear progression
    assert state_25["opacity"] < 0.25  # Slower at start
    assert state_50["opacity"] == 0.5  # Middle point
    assert state_75["opacity"] > 0.75  # Slower at end


def test_effect_preview(client, scene, auth_headers):
    """Test effect preview generation."""
    effect = VisualEffectFactory(scene=scene)

    response = client.get(
        f"/api/visual-effects/{effect.id}/preview", headers=auth_headers
    )
    assert response.status_code == 200
    assert "preview_data" in response.json
    assert "keyframes" in response.json["preview_data"]


def test_audio_waveform(client, scene, auth_headers):
    """Test audio waveform generation."""
    track = AudioTrackFactory(scene=scene)

    response = client.get(
        f"/api/audio-tracks/{track.id}/waveform", headers=auth_headers
    )
    assert response.status_code == 200
    assert "waveform_data" in response.json
    assert "points" in response.json["waveform_data"]


def test_effect_template(client, auth_headers):
    """Test effect template system."""
    # Create effect from template
    response = client.post(
        "/api/effect-templates/apply",
        json={
            "template_name": "fade-slide-in",
            "parameters": {"direction": "left", "duration": 1.5},
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert "effects" in response.json
    assert len(response.json["effects"]) > 1  # Should create multiple effects
