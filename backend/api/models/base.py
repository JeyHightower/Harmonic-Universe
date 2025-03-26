from datetime import datetime
from ..database import db

class BaseModel(db.Model):
    __abstract__ = True
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Timestamps
    created_at = db.Column(db.TIMESTAMP(timezone=True), default=datetime.utcnow, index=True)
    updated_at = db.Column(db.TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    # Soft delete
    is_deleted = db.Column(db.Boolean, default=False, index=True)
    deleted_at = db.Column(db.TIMESTAMP(timezone=True), nullable=True)
    
    # Version tracking
    version = db.Column(db.Integer, default=1, nullable=False)
    
    # Metadata
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    updated_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    def soft_delete(self, user_id=None):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        if user_id:
            self.updated_by_id = user_id
    
    def increment_version(self, user_id=None):
        self.version += 1
        if user_id:
            self.updated_by_id = user_id
    
    def to_dict(self):
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'version': self.version,
            'created_by_id': self.created_by_id,
            'updated_by_id': self.updated_by_id
        } 