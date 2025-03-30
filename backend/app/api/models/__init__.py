from flask_login import UserMixin
from ..models.database import db
from .base import BaseModel
from .user import User
from .universe import Universe, Scene
from .physics import PhysicsObject, Physics2D, Physics3D, PhysicsConstraint
from .audio import SoundProfile, AudioSample, MusicPiece, Harmony, MusicalTheme
from .character import Character
from .note import Note

# Set up relationships
User.notes = db.relationship('Note', backref='user', lazy=True)
User.universes = db.relationship('Universe', backref='user', lazy=True)
User.sound_profiles = db.relationship('SoundProfile', backref='user', lazy=True)

Universe.scenes = db.relationship('Scene', backref='universe', lazy=True, cascade='all, delete-orphan')
Universe.notes = db.relationship('Note', backref='universe', lazy=True)
Universe.sound_profile = db.relationship('SoundProfile', backref='universe', uselist=False, lazy=True)
Universe.physics_2d = db.relationship('Physics2D', backref='universe', uselist=False, lazy=True)
Universe.physics_3d = db.relationship('Physics3D', backref='universe', uselist=False, lazy=True)

Scene.notes = db.relationship('Note', backref='scene', lazy=True)
Scene.characters = db.relationship('Character', secondary='character_scenes', backref='scenes', lazy=True)
Scene.physics_objects = db.relationship('PhysicsObject', backref='scene', lazy=True)
Scene.physics_constraints = db.relationship('PhysicsConstraint', backref='scene', lazy=True)

Character.notes = db.relationship('Note', backref='character', lazy=True)
Character.musical_themes = db.relationship('MusicalTheme', backref='character', lazy=True)

SoundProfile.audio_samples = db.relationship('AudioSample', backref='sound_profile', lazy=True)
SoundProfile.music_pieces = db.relationship('MusicPiece', backref='sound_profile', lazy=True)

MusicPiece.harmonies = db.relationship('Harmony', backref='music_piece', lazy=True)
MusicPiece.musical_themes = db.relationship('MusicalTheme', backref='music_piece', lazy=True)

__all__ = [
    'BaseModel',
    'User',
    'Universe',
    'Scene',
    'PhysicsObject',
    'Physics2D',
    'Physics3D',
    'PhysicsConstraint',
    'SoundProfile',
    'AudioSample',
    'MusicPiece',
    'Harmony',
    'MusicalTheme',
    'Character',
    'Note'
] 