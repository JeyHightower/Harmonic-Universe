from app import db
from datetime import datetime


class Profile(db.Model):
    """Model for user profiles."""

    __tablename__ = "profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    website = db.Column(db.String(200))
    avatar_url = db.Column(db.String(200))
    social_links = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user = db.relationship("User", back_populates="profile", uselist=False)

    def __init__(
        self,
        user_id,
        bio=None,
        location=None,
        website=None,
        avatar_url=None,
        social_links=None,
    ):
        self.user_id = user_id
        self.bio = bio
        self.location = location
        self.website = website
        self.avatar_url = avatar_url
        self.social_links = social_links or {}

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bio": self.bio,
            "location": self.location,
            "website": self.website,
            "avatar_url": self.avatar_url,
            "social_links": self.social_links,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def update(self, data):
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
        return self
