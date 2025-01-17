from app.extensions import db

class PhysicsParameter(db.Model):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False)
    parameter_name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50))

    # Relationships
    universe = db.relationship('Universe', back_populates='physics_parameters')

    def __repr__(self):
        return f'<PhysicsParameter {self.parameter_name} for Universe {self.universe_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'universe_id': self.universe_id,
            'parameter_name': self.parameter_name,
            'value': self.value,
            'unit': self.unit
        }
