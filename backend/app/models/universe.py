from ..extensions import db

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    user = db.relationship('User', back_populates='universes')
    comments = db.relationship('Comment', back_populates='universe', cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', back_populates='universe', cascade='all, delete-orphan')
    favorited_by = db.relationship(
        'User',
        secondary='favorites',
        back_populates='favorite_universes',
        overlaps="favorites,users_favorited",
        viewonly=True
    )
    physics_parameters = db.relationship('PhysicsParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    music_parameters = db.relationship('MusicParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    audio_parameters = db.relationship('AudioParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    visualization_parameters = db.relationship('VisualizationParameters', back_populates='universe', cascade='all, delete-orphan', uselist=False)
    storyboard_points = db.relationship('StoryboardPoint', back_populates='universe', cascade='all, delete-orphan', order_by='StoryboardPoint.timestamp')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'is_public': self.is_public,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'physics_parameters': self.physics_parameters.to_dict() if self.physics_parameters else None,
            'music_parameters': self.music_parameters.to_dict() if self.music_parameters else None,
            'audio_parameters': self.audio_parameters.to_dict() if self.audio_parameters else None,
            'visualization_parameters': self.visualization_parameters.to_dict() if self.visualization_parameters else None,
            'storyboard_points': [point.to_dict() for point in self.storyboard_points]
        }

    def __repr__(self):
        return f'<Universe {self.title}>'
