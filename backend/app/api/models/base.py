from datetime import datetime
from ..models.database import db

class BaseModel(db.Model):
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    is_deleted = db.Column(db.Boolean, default=False, index=True)
    
    def save(self):
        """Save the model to the database."""
        db.session.add(self)
        db.session.commit()
        
    def delete(self):
        """Soft delete the model."""
        self.is_deleted = True
        self.save()
        
    @classmethod
    def get_by_id(cls, id):
        """Get a model by ID, excluding soft-deleted records."""
        return cls.query.filter_by(id=id, is_deleted=False).first()
        
    @classmethod
    def get_all(cls):
        """Get all non-deleted models."""
        return cls.query.filter_by(is_deleted=False).all() 