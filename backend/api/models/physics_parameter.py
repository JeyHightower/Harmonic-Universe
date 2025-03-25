from datetime import datetime
from ..database import db
from .base import BaseModel

class PhysicsParameter(BaseModel):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parameter_type = db.Column(db.String(50), nullable=False)  # gravity, friction, etc.
    value = db.Column(db.Float, nullable=False)
    min_value = db.Column(db.Float)
    max_value = db.Column(db.Float)
    step = db.Column(db.Float)
    unit = db.Column(db.String(20))
    physics_2d_id = db.Column(db.Integer, db.ForeignKey('physics_2d.id'))
    physics_3d_id = db.Column(db.Integer, db.ForeignKey('physics_3d.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    physics_2d = db.relationship('Physics2D', backref=db.backref('parameters', lazy=True))
    physics_3d = db.relationship('Physics3D', backref=db.backref('parameters', lazy=True))
    
    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parameter_type': self.parameter_type,
            'value': self.value,
            'min_value': self.min_value,
            'max_value': self.max_value,
            'step': self.step,
            'unit': self.unit,
            'physics_2d_id': self.physics_2d_id,
            'physics_3d_id': self.physics_3d_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        })
        return base_dict 