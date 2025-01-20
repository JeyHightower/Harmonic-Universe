from ..extensions import db
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, Any, Optional

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship('User', back_populates='universes')
    template = relationship('Template', back_populates='universes')
    physics_parameters = relationship('PhysicsParameters', uselist=False, back_populates='universe',
                                   cascade='all, delete-orphan')
    music_parameters = relationship('MusicParameters', uselist=False, back_populates='universe',
                                  cascade='all, delete-orphan')
    audio_parameters = relationship('AudioParameters', uselist=False, back_populates='universe',
                                 cascade='all, delete-orphan')
    visualization_parameters = relationship('VisualizationParameters', uselist=False, back_populates='universe',
                                        cascade='all, delete-orphan')
    comments = relationship('Comment', back_populates='universe', cascade='all, delete-orphan')
    favorites = relationship('Favorite', back_populates='universe', overlaps="favorited_by")
    favorited_by = relationship('User', secondary='favorites',
                              back_populates='favorite_universes',
                              overlaps="favorites")
    storyboards = relationship('Storyboard', back_populates='universe', cascade='all, delete-orphan')

    def __init__(self, name: str, description: str = None, is_public: bool = True,
                 user_id: int = None):
        self.name = name
        self.description = description
        self.is_public = is_public
        self.user_id = user_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'physics_parameters': self.physics_parameters.to_dict() if self.physics_parameters else None,
            'music_parameters': self.music_parameters.to_dict() if self.music_parameters else None,
            'audio_parameters': self.audio_parameters.to_dict() if self.audio_parameters else None,
            'visualization_parameters': self.visualization_parameters.to_dict() if self.visualization_parameters else None
        }

    def update_dependent_parameters(self, source: str):
        if source == 'physics':
            if self.physics_parameters and self.music_parameters:
                gravity = self.physics_parameters.gravity
                self.music_parameters.tempo = min(200, max(40, int(120 * (gravity / 9.81))))

            if self.physics_parameters and self.audio_parameters:
                self.audio_parameters.volume = min(1.0, max(0.0, self.physics_parameters.gravity / 20))

        elif source == 'music':
            if self.music_parameters and self.audio_parameters:
                self.audio_parameters.pitch = min(1.0, max(0.0, (self.music_parameters.tempo - 40) / 160))

        elif source == 'audio':
            if self.audio_parameters and self.physics_parameters:
                self.physics_parameters.gravity = min(20.0, max(1.0, 9.81 * (self.audio_parameters.volume * 20)))

    def get_ai_suggestions(self, ai_service, target: str, constraints: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return ai_service.get_parameter_suggestions(self.id, target, constraints)

    def generate_music_notes(self) -> Dict[str, Any]:
        if not self.music_parameters:
            return {'error': 'No music parameters set'}

        return {
            'notes': [
                {
                    'pitch': 60,
                    'startTime': 0.0,
                    'duration': 0.5,
                    'velocity': 0.8
                },
                {
                    'pitch': 64,
                    'startTime': 0.5,
                    'duration': 0.5,
                    'velocity': 0.7
                },
                {
                    'pitch': 67,
                    'startTime': 1.0,
                    'duration': 1.0,
                    'velocity': 0.9
                }
            ],
            'tempo': self.music_parameters.tempo,
            'key': self.music_parameters.key,
            'scale': self.music_parameters.scale
        }

    def __repr__(self):
        return f'<Universe {self.name}>'
