from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notes = db.relationship('Note', backref='user', lazy=True, cascade='all, delete-orphan')
    universes = db.relationship('Universe', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='user', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='user', lazy=True, cascade='all, delete-orphan')
    
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
            'updated_at': self.updated_at.isoformat()
        }

class Universe(db.Model):
    __tablename__ = 'universes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scenes = db.relationship('Scene', backref='universe', lazy=True, cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='universe', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='universe', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Scene(db.Model):
    __tablename__ = 'scenes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notes = db.relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    characters = db.relationship('Character', secondary='character_scenes', backref='scenes', lazy=True)
    physics_objects = db.relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d = db.relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d = db.relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Character(db.Model):
    __tablename__ = 'characters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notes = db.relationship('Note', backref='character', lazy=True, cascade='all, delete-orphan')
    physics_objects = db.relationship('PhysicsObject', backref='character', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'))
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'character_id': self.character_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Association table for Character-Scene relationship
character_scenes = db.Table('character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), primary_key=True)
)

class Physics2D(db.Model):
    __tablename__ = 'physics_2d'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'))
    gravity = db.Column(db.Float, default=9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    elasticity = db.Column(db.Float, default=0.5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'updated_at': self.updated_at.isoformat()
        }

class Physics3D(db.Model):
    __tablename__ = 'physics_3d'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'))
    gravity = db.Column(db.Float, default=9.81)
    air_resistance = db.Column(db.Float, default=0.0)
    friction = db.Column(db.Float, default=0.0)
    elasticity = db.Column(db.Float, default=0.5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'updated_at': self.updated_at.isoformat()
        }

class PhysicsObject(db.Model):
    __tablename__ = 'physics_objects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'sphere', 'cube', 'plane'
    mass = db.Column(db.Float, default=1.0)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)
    velocity_x = db.Column(db.Float, default=0.0)
    velocity_y = db.Column(db.Float, default=0.0)
    velocity_z = db.Column(db.Float, default=0.0)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'))
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'))
    physics_2d_id = db.Column(db.Integer, db.ForeignKey('physics_2d.id', ondelete='CASCADE'))
    physics_3d_id = db.Column(db.Integer, db.ForeignKey('physics_3d.id', ondelete='CASCADE'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'updated_at': self.updated_at.isoformat()
        }

class PhysicsConstraint(db.Model):
    __tablename__ = 'physics_constraints'
    
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'hinge', 'spring', 'fixed'
    object1_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False)
    object2_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id', ondelete='CASCADE'), nullable=False)
    parameters = db.Column(db.JSON)  # Store constraint-specific parameters
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'))
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
            'updated_at': self.updated_at.isoformat()
        } 