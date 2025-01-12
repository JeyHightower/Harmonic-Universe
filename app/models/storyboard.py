from app import db

class Storyboard(db.Model):
    __tablename__ = 'storyboards'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    plot_point = db.Column(db.String(200), nullable=False, index=True)  # Index added
    description = db.Column(db.Text, nullable=False)
    harmony_tie = db.Column(db.Float, nullable=True, index=True)  # Index added
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    universe = db.relationship('Universe', back_populates='storyboards')

    def __repr__(self):
        return f"<Storyboard {self.plot_point}>"
