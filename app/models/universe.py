from app.models import db

class Universe(db.Model):
    __tablename__ = 'universes'

    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False, index=True)  # Index added
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    user = db.relationship('User', back_populates='universes')
    physics_parameters = db.relationship('PhysicsParameter', back_populates='universe', cascade='all, delete')
    music_parameters = db.relationship('MusicParameter', back_populates='universe', cascade='all, delete')
    storyboards = db.relationship('Storyboard', back_populates='universe', cascade='all, delete')

    def __repr__(self):
        return f"<Universe {self.name}>"
