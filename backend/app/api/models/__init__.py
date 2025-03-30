from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from ..models.database import db

class BaseModel(db.Model):
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    is_deleted = db.Column(db.Boolean, default=False, index=True)

class User(UserMixin, BaseModel):
    __tablename__ = 'users'
    
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))
    version = db.Column(db.Integer, nullable=False, default=1)
    
    # Relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')
    universes = db.relationship('Universe', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='user', lazy=True, cascade='all, delete-orphan')
    sound_profiles = db.relationship('SoundProfile', backref='user', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='user', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, username=None, email=None):
        super().__init__()
        self.username = username
        self.email = email
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class SoundProfile(BaseModel):
    __tablename__ = 'sound_profiles'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    ambient_volume = db.Column(db.Float, default=0.5)
    music_volume = db.Column(db.Float, default=0.5)
    effects_volume = db.Column(db.Float, default=0.5)
    
    # Relationships
    audio_samples = db.relationship('AudioSample', backref='sound_profile', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='sound_profile', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
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
    
    def to_dict(self):
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
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
    
    def to_dict(self):
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
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Harmony(BaseModel):
    __tablename__ = 'harmonies'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id', ondelete='CASCADE'), nullable=False, index=True)
    chord_progression = db.Column(db.JSON)  # Store chord progression data
    duration = db.Column(db.Float)  # Duration in seconds
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'music_piece_id': self.music_piece_id,
            'chord_progression': self.chord_progression,
            'duration': self.duration,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class MusicalTheme(BaseModel):
    __tablename__ = 'musical_themes'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    music_piece_id = db.Column(db.Integer, db.ForeignKey('music_pieces.id', ondelete='CASCADE'), nullable=False, index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), nullable=False, index=True)
    motif = db.Column(db.JSON)  # Store musical motif data
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'music_piece_id': self.music_piece_id,
            'character_id': self.character_id,
            'motif': self.motif,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Universe(BaseModel):
    __tablename__ = 'universes'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    
    # Relationships
    scenes = db.relationship('Scene', backref='universe', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='universe', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='universe', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='universe', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='universe', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Scene(BaseModel):
    __tablename__ = 'scenes'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id = db.Column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    
    # Relationships
    notes = db.relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', secondary='character_scenes', backref='scenes', lazy=True)
    physics_objects = db.relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    audio_samples = db.relationship('AudioSample', backref='scene', lazy=True, cascade='all, delete-orphan')
    music_pieces = db.relationship('MusicPiece', backref='scene', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'sound_profile_id': self.sound_profile_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Character(BaseModel):
    __tablename__ = 'characters'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Relationships
    notes = db.relationship('Note', backref='character', lazy=True, cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', backref='character', lazy=True, cascade='all, delete-orphan')
    musical_themes = db.relationship('MusicalTheme', backref='character', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Note(BaseModel):
    __tablename__ = 'notes'
    
    content = db.Column(db.Text, nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'character_id': self.character_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

# Association table for Character-Scene relationship
character_scenes = db.Table('character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), primary_key=True)
)

class Physics2D(BaseModel):
    __tablename__ = 'physics_2d'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    gravity = db.Column(db.Float, default=9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    elasticity = db.Column(db.Float, default=0.5)
    
    # Relationships
    physics_objects = db.relationship('PhysicsObject', backref='physics_2d', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'gravity': self.gravity,
            'air_resistance': self.air_resistance,
            'friction': self.friction,
            'elasticity': self.elasticity,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class Physics3D(BaseModel):
    __tablename__ = 'physics_3d'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    gravity = db.Column(db.Float, default=9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    elasticity = db.Column(db.Float, default=0.5)
    
    # Relationships
    physics_objects = db.relationship('PhysicsObject', backref='physics_3d', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'gravity': self.gravity,
            'air_resistance': self.air_resistance,
            'friction': self.friction,
            'elasticity': self.elasticity,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class PhysicsObject(BaseModel):
    __tablename__ = 'physics_objects'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # e.g., 'sphere', 'cube', 'plane'
    mass = db.Column(db.Float, default=1.0)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    velocity_x = db.Column(db.Float, default=0.0)
    velocity_y = db.Column(db.Float, default=0.0)
    velocity_z = db.Column(db.Float, default=0.0)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), index=True)
    physics_2d_id = db.Column(db.Integer, db.ForeignKey('physics_2d.id', ondelete='CASCADE'), index=True)
    physics_3d_id = db.Column(db.Integer, db.ForeignKey('physics_3d.id', ondelete='CASCADE'), index=True)
    
    # Relationships
    constraints_as_object1 = db.relationship('PhysicsConstraint', 
                                           foreign_keys='PhysicsConstraint.object1_id',
                                           backref='object1',
                                           lazy=True,
                                           cascade='all, delete-orphan')
    constraints_as_object2 = db.relationship('PhysicsConstraint',
                                           foreign_keys='PhysicsConstraint.object2_id',
                                           backref='object2',
                                           lazy=True,
                                           cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'mass': self.mass,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'position_z': self.position_z,
            'velocity_x': self.velocity_x,
            'velocity_y': self.velocity_y,
            'velocity_z': self.velocity_z,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'character_id': self.character_id,
            'physics_2d_id': self.physics_2d_id,
            'physics_3d_id': self.physics_3d_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }

class PhysicsConstraint(BaseModel):
    __tablename__ = 'physics_constraints'
    
    type = db.Column(db.String(50), nullable=False, index=True)  # e.g., 'hinge', 'spring', 'fixed'
    object1_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False, index=True)
    object2_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False, index=True)
    parameters = db.Column(db.JSON)  # Store constraint-specific parameters
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'object1_id': self.object1_id,
            'object2_id': self.object2_id,
            'parameters': self.parameters,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        } 