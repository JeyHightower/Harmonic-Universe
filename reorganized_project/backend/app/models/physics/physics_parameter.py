from datetime import datetime
from app.app import db

class PhysicsParameter(db.Model):
    __tablename__ = 'physics_parameters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parameter_type = db.Column(db.String(50), nullable=False)
    physics_object_id = db.Column(db.Integer, db.ForeignKey('physics_objects.id'), nullable=False)
    
    # Parameter values
    value = db.Column(db.Float, nullable=False)
    min_value = db.Column(db.Float)
    max_value = db.Column(db.Float)
    unit = db.Column(db.String(20))
    
    # Harmonics parameters
    affects_harmony = db.Column(db.Boolean, default=False)
    harmony_weight = db.Column(db.Float, default=1.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    physics_object = db.relationship('PhysicsObject', back_populates='parameters')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parameter_type': self.parameter_type,
            'physics_object_id': self.physics_object_id,
            'value': self.value,
            'min_value': self.min_value,
            'max_value': self.max_value,
            'unit': self.unit,
            'affects_harmony': self.affects_harmony,
            'harmony_weight': self.harmony_weight,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }