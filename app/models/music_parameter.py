from app.models import db

class MusicParameter(db.Model):
    __tablename__ = 'music_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False, index=True)  # Index added
    value = db.Column(db.Float, nullable=False)
    instrument = db.Column(db.String(50), nullable=True, index=True)

    # Relationships
    universe = db.relationship('Universe', back_populates='music_parameters')

    def __repr__(self):
        return f"<MusicParameter {self.parameter_name}: {self.value}>"
