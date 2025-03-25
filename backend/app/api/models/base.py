from datetime import datetime
from ..database import db

class BaseModel(db.Model):
    __abstract__ = True
    
    created_at = db.Column(db.TIMESTAMP(timezone=True), default=datetime.utcnow, index=True)
    updated_at = db.Column(db.TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 