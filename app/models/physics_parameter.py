from app.models import db

class PhysicsParameter(db.Model):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False, index=True)  # Index added
    value = db.Column(db.Float, nullable=False)

    # Relationships
    universe = db.relationship('Universe', back_populates='physics_parameters')

    def __repr__(self):
        return f"<PhysicsParameter {self.parameter_name}: {self.value}>"
