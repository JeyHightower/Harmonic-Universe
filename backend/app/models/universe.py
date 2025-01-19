from ..extensions import db
from sqlalchemy.orm import relationship

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    user = relationship('User', back_populates='universes')
    template = relationship('Template', back_populates='universes')
    comments = relationship('Comment', back_populates='universe', cascade='all, delete-orphan')
    favorites = relationship('Favorite', back_populates='universe', cascade='all, delete-orphan')
    favorited_by = relationship(
        'User',
        secondary='favorites',
        back_populates='favorite_universes',
        overlaps="favorites,users_favorited",
        viewonly=True
    )
    physics_parameters = relationship('PhysicsParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    music_parameters = relationship('MusicParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    audio_parameters = relationship('AudioParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    visualization_parameters = relationship('VisualizationParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    storyboards = relationship('Storyboard', back_populates='universe', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'is_public': self.is_public,
            'user_id': self.user_id,
            'template_id': self.template_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'physics_parameters': self.physics_parameters.to_dict() if self.physics_parameters else None,
            'music_parameters': self.music_parameters.to_dict() if self.music_parameters else None,
            'audio_parameters': self.audio_parameters.to_dict() if self.audio_parameters else None,
            'visualization_parameters': self.visualization_parameters.to_dict() if self.visualization_parameters else None,
            'storyboards': [storyboard.to_dict() for storyboard in self.storyboards]
        }

    def __repr__(self):
        return f'<Universe {self.title}>'
