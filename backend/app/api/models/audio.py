from ...extensions import db
from .base import BaseModel
from datetime import datetime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .universe import Universe

class SoundProfile(BaseModel):
    __tablename__ = 'sound_profiles'

    name: Mapped[str] = mapped_column(db.String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id: Mapped[Optional[int]] = mapped_column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id: Mapped[Optional[int]] = mapped_column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    ambient_volume: Mapped[float] = mapped_column(db.Float, default=0.5)
    music_volume: Mapped[float] = mapped_column(db.Float, default=0.5)
    effects_volume: Mapped[float] = mapped_column(db.Float, default=0.5)

    # Relationships
    audio_samples: Mapped[List['AudioSample']] = relationship('AudioSample', backref='sound_profile', lazy=True, cascade='all, delete-orphan')
    music_pieces: Mapped[List['MusicPiece']] = relationship('MusicPiece', backref='sound_profile', lazy=True, cascade='all, delete-orphan')
    child_universe: Mapped[Optional['Universe']] = relationship(
        'Universe',
        foreign_keys='Universe.sound_profile_id',
        back_populates='sound_profile',
        overlaps="parent_universe,owned_sound_profile",
        uselist=False,
        lazy=True
    )
    parent_universe: Mapped[Optional['Universe']] = relationship(
        'Universe',
        foreign_keys=[universe_id],
        back_populates='owned_sound_profile',
        overlaps="child_universe,sound_profile",
        uselist=False,
        lazy=True
    )

    def validate(self):
        """Validate sound profile data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not 0 <= self.ambient_volume <= 1:
            raise ValueError("Ambient volume must be between 0 and 1")
        if not 0 <= self.music_volume <= 1:
            raise ValueError("Music volume must be between 0 and 1")
        if not 0 <= self.effects_volume <= 1:
            raise ValueError("Effects volume must be between 0 and 1")

    def to_dict(self):
        """Convert sound profile to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'ambient_volume': self.ambient_volume,
            'music_volume': self.music_volume,
            'effects_volume': self.effects_volume,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

class AudioSample(BaseModel):
    __tablename__ = 'audio_samples'

    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Float)  # Duration in seconds
    sample_rate = db.Column(db.Integer)
    channels = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='CASCADE'), index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)

    def validate(self):
        """Validate audio sample data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.file_path:
            raise ValueError("File path is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if self.duration is not None and self.duration <= 0:
            raise ValueError("Duration must be positive")
        if self.sample_rate is not None and self.sample_rate <= 0:
            raise ValueError("Sample rate must be positive")
        if self.channels is not None and self.channels <= 0:
            raise ValueError("Channels must be positive")

    def to_dict(self):
        """Convert audio sample to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'duration': self.duration,
            'sample_rate': self.sample_rate,
            'channels': self.channels,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

class MusicPiece(BaseModel):
    __tablename__ = 'music_pieces'

    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Float)  # Duration in seconds
    tempo = db.Column(db.Integer)  # BPM
    key = db.Column(db.String(10))  # Musical key
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='CASCADE'), index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)

    # Relationships
    harmonies = db.relationship('Harmony', backref='music_piece', lazy=True, cascade='all, delete-orphan')
    musical_themes = db.relationship('MusicalTheme', backref='music_piece', lazy=True, cascade='all, delete-orphan')

    def validate(self):
        """Validate music piece data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.file_path:
            raise ValueError("File path is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if self.duration is not None and self.duration <= 0:
            raise ValueError("Duration must be positive")
        if self.tempo is not None and self.tempo <= 0:
            raise ValueError("Tempo must be positive")
        if self.key and not self.key in ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']:
            raise ValueError("Invalid musical key")

    def to_dict(self):
        """Convert music piece to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'file_path': self.file_path,
            'duration': self.duration,
            'tempo': self.tempo,
            'key': self.key,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

class Harmony(BaseModel):
    __tablename__ = 'harmonies'

    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id', ondelete='CASCADE'), nullable=False, index=True)
    chord_progression = db.Column(db.JSON)  # Store chord progression data
    duration = db.Column(db.Float)  # Duration in seconds

    def validate(self):
        """Validate harmony data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.music_piece_id:
            raise ValueError("Music piece ID is required")
        if not self.chord_progression:
            raise ValueError("Chord progression is required")
        if self.duration is not None and self.duration <= 0:
            raise ValueError("Duration must be positive")

    def to_dict(self):
        """Convert harmony to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'music_piece_id': self.music_piece_id,
            'chord_progression': self.chord_progression,
            'duration': self.duration,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

class MusicalTheme(BaseModel):
    __tablename__ = 'musical_themes'

    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id', ondelete='CASCADE'), nullable=False, index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False, index=True)
    motif = db.Column(db.JSON)  # Store musical motif data

    def validate(self):
        """Validate musical theme data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.music_piece_id:
            raise ValueError("Music piece ID is required")
        if not self.character_id:
            raise ValueError("Character ID is required")
        if not self.motif:
            raise ValueError("Motif is required")

    def to_dict(self):
        """Convert musical theme to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'music_piece_id': self.music_piece_id,
            'character_id': self.character_id,
            'motif': self.motif,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

class Music(BaseModel):
    """Model for storing music settings and data"""
    __tablename__ = 'music'

    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    music_data = db.Column(db.JSON, nullable=False)  # Store generated music data
    algorithm = db.Column(db.String(50), default='harmonic_synthesis')  # Type of algorithm used
    tempo = db.Column(db.Integer, default=120)  # BPM
    key = db.Column(db.String(10), default='C')  # Musical key (C, D, E, etc.)
    scale = db.Column(db.String(20), default='major')  # Scale (major, minor, pentatonic, etc.)
    parameters = db.Column(db.JSON)  # Store algorithm-specific parameters
    audio_url = db.Column(db.String(255))  # URL to generated audio file if available

    def validate(self):
        """Validates the Music data"""
        if not self.name:
            raise ValueError("Name is required")
        if not self.music_data:
            raise ValueError("Music data is required")
        return True

    def to_dict(self):
        """Convert instance to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'music_data': self.music_data,
            'algorithm': self.algorithm,
            'tempo': self.tempo,
            'key': self.key,
            'scale': self.scale,
            'parameters': self.parameters,
            'audio_url': self.audio_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted
        }
