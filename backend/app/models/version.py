from datetime import datetime
from app.extensions import db

class Version(db.Model):
    """Model for storing version history of storyboard content."""
    __tablename__ = 'versions'

    id = db.Column(db.Integer, primary_key=True)
    storyboard_id = db.Column(db.Integer, db.ForeignKey('storyboards.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))

    # Relationships
    storyboard = db.relationship('Storyboard', back_populates='versions')
    creator = db.relationship('User', back_populates='versions')

    def __repr__(self):
        return f'<Version {self.id} for Storyboard {self.storyboard_id}>'

    def to_dict(self):
        """Convert version to dictionary."""
        return {
            'id': self.id,
            'storyboard_id': self.storyboard_id,
            'content': self.content,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'created_by': self.created_by
        }

    @staticmethod
    def create_version(storyboard_id, content, description=None, created_by=None):
        """Create a new version."""
        version = Version(
            storyboard_id=storyboard_id,
            content=content,
            description=description,
            created_by=created_by
        )
        db.session.add(version)
        db.session.commit()
        return version

    @staticmethod
    def get_versions(storyboard_id, limit=10):
        """Get versions for a storyboard."""
        return Version.query.filter_by(storyboard_id=storyboard_id)\
            .order_by(Version.created_at.desc())\
            .limit(limit)\
            .all()

    @staticmethod
    def get_version(version_id):
        """Get a specific version."""
        return Version.query.get_or_404(version_id)
