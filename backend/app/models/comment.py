from datetime import datetime, timezone
from app.extensions import db

class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship('User', back_populates='comments')
    universe = db.relationship('Universe', back_populates='comments')
    parent = db.relationship('Comment', remote_side=[id], back_populates='replies')
    replies = db.relationship('Comment', back_populates='parent', cascade='all, delete-orphan')

    def to_dict(self, include_replies=True):
        """Convert comment to dictionary"""
        comment_dict = {
            'id': self.id,
            'content': self.content,
            'universe_id': self.universe_id,
            'user_id': self.user_id,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': {
                'id': self.user.id,
                'email': self.user.email
            }
        }

        if include_replies:
            comment_dict['replies'] = [reply.to_dict(include_replies=False) for reply in self.replies]

        return comment_dict

    def __repr__(self):
        return f"<Comment {self.id} by User {self.user_id} on Universe {self.universe_id}>"
