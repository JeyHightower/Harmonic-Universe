from app import db
from datetime import datetime

class PhysicsParameter(db.Model):
    __tablename__ = 'physics_parameters'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parameter_type = db.Column(db.String(50), nullable=False)  # float, int, bool, vector2, vector3, etc.
    float_value = db.Column(db.Float, nullable=True)
    int_value = db.Column(db.Integer, nullable=True)
    bool_value = db.Column(db.Boolean, nullable=True)
    string_value = db.Column(db.String(255), nullable=True)
    min_value = db.Column(db.Float, nullable=True)  # For range constraints
    max_value = db.Column(db.Float, nullable=True)  # For range constraints
    vector_x = db.Column(db.Float, nullable=True)  # For vector types
    vector_y = db.Column(db.Float, nullable=True)  # For vector types
    vector_z = db.Column(db.Float, nullable=True)  # For vector types
    is_2d = db.Column(db.Boolean, default=True)    # Whether this is for 2D or 3D
    physics_2d_id = db.Column(db.Integer, db.ForeignKey('physics_2d.id'), nullable=True)
    physics_3d_id = db.Column(db.Integer, db.ForeignKey('physics_3d.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    physics_2d = db.relationship('Physics2D', backref=db.backref('parameters', lazy=True))
    physics_3d = db.relationship('Physics3D', backref=db.backref('parameters', lazy=True))
    
    def get_value(self):
        """Get the appropriate value based on parameter_type"""
        if self.parameter_type == 'float':
            return self.float_value
        elif self.parameter_type == 'int':
            return self.int_value
        elif self.parameter_type == 'bool':
            return self.bool_value
        elif self.parameter_type == 'string':
            return self.string_value
        elif self.parameter_type == 'vector2':
            return {'x': self.vector_x, 'y': self.vector_y}
        elif self.parameter_type == 'vector3':
            return {'x': self.vector_x, 'y': self.vector_y, 'z': self.vector_z}
        return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'parameter_type': self.parameter_type,
            'value': self.get_value(),
            'min_value': self.min_value,
            'max_value': self.max_value,
            'is_2d': self.is_2d,
            'physics_2d_id': self.physics_2d_id,
            'physics_3d_id': self.physics_3d_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 