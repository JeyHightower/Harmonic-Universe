from app import db
from datetime import datetime


class Comment(db.Model):
    """Model for universe comments and discussions."""

    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    universe_id = db.Column(
        db.Integer, db.ForeignKey("universes.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    parent_id = db.Column(
        db.Integer, db.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True
    )
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    is_edited = db.Column(db.Boolean, default=False)

    # Relationships
    universe = db.relationship("Universe", back_populates="comments")
    user = db.relationship("User", back_populates="comments")
    replies = db.relationship(
        "Comment",
        back_populates="parent",
        lazy="dynamic",
        cascade="all, delete-orphan",
        remote_side=[id],
    )
    parent = db.relationship(
        "Comment", back_populates="replies", remote_side=[parent_id]
    )

    def __init__(self, universe_id, user_id, content, parent_id=None):
        self.universe_id = universe_id
        self.user_id = user_id
        self.content = content
        self.parent_id = parent_id

    def to_dict(self, include_replies=True):
        data = {
            "id": self.id,
            "universe_id": self.universe_id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_edited": self.is_edited,
            "user": self.user.to_dict() if self.user else None,
        }
        if include_replies:
            data["replies"] = [
                reply.to_dict(include_replies=False) for reply in self.replies
            ]
        return data

    @staticmethod
    def get_universe_comments(universe_id, parent_id=None):
        """Get all top-level comments for a universe."""
        return (
            Comment.query.filter_by(universe_id=universe_id, parent_id=parent_id)
            .order_by(Comment.created_at.desc())
            .all()
        )

    @staticmethod
    def get_user_comments(user_id):
        """Get all comments by a user."""
        return (
            Comment.query.filter_by(user_id=user_id)
            .order_by(Comment.created_at.desc())
            .all()
        )

    def __repr__(self):
        return (
            f"<Comment {self.id} by User {self.user_id} on Universe {self.universe_id}>"
        )
