from . import db
from datetime import datetime
import json

class Profile(db.Model):
    """Profile model for storing user profile information."""

    __tablename__ = 'profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    display_name = db.Column(db.String(80))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, user_id, display_name=None, bio=None, avatar_url=None):
        self.user_id = user_id
        self.display_name = display_name
        self.bio = bio
        self.avatar_url = avatar_url

    def to_dict(self):
        """Convert profile object to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'display_name': self.display_name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Profile {self.display_name}>'

    def set_preferences(self, preferences):
        """Set preferences, ensuring it's stored as a JSON string"""
        if isinstance(preferences, str):
            try:
                # Validate it's proper JSON
                json.loads(preferences)
                self.preferences = preferences
            except json.JSONDecodeError:
                self.preferences = '{}'
        else:
            try:
                self.preferences = json.dumps(preferences)
            except (TypeError, ValueError):
                self.preferences = '{}'
        return self.get_preferences()  # Return parsed preferences for immediate use

    def get_preferences(self):
        """Get preferences as a dictionary"""
        try:
            return json.loads(self.preferences or '{}')
        except (json.JSONDecodeError, TypeError):
            self.preferences = '{}'  # Reset invalid preferences
            return {}

    def update(self, data):
        """Update profile attributes"""
        if not isinstance(data, dict):
            raise ValueError("Update data must be a dictionary")

        allowed_fields = {'bio', 'location', 'preferences'}
        updated = False

        for key, value in data.items():
            if key in allowed_fields:
                if key == 'preferences':
                    current_prefs = self.get_preferences()
                    if isinstance(value, dict):
                        current_prefs.update(value)
                        self.set_preferences(current_prefs)
                    else:
                        self.set_preferences(value)
                else:
                    if value is not None:  # Only update if value is not None
                        setattr(self, key, value)
                updated = True

        if updated:
            self.updated_at = datetime.utcnow()
            self.validate()  # Validate before saving
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                raise ValueError(f"Failed to update profile: {str(e)}")

    def validate(self):
        """Validate profile data"""
        if self.user_id is None:
            raise ValueError("user_id is required")

        if self.bio and len(self.bio) > 500:
            raise ValueError("Bio must be less than 500 characters")

        if self.location and len(self.location) > 200:
            raise ValueError("Location must be less than 200 characters")

        try:
            prefs = json.loads(self.preferences or '{}')
            if not isinstance(prefs, dict):
                raise ValueError("Preferences must be a JSON object")
        except json.JSONDecodeError:
            raise ValueError("Invalid preferences format")

    def __json__(self):
        """Return a JSON serializable representation of the profile"""
        return self.to_dict()
