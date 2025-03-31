from app.extensions import db
from .base import BaseModel

class Note(BaseModel):
    __tablename__ = 'notes'
    
    title = db.Column(db.String(200), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), nullable=True, index=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), nullable=True, index=True)
    tags = db.Column(db.JSON)  # Store note tags
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    is_archived = db.Column(db.Boolean, nullable=False, default=False)
    position_x = db.Column(db.Float, nullable=False, default=0.0)
    position_y = db.Column(db.Float, nullable=False, default=0.0)
    position_z = db.Column(db.Float, nullable=False, default=0.0)
    
    def validate(self):
        """Validate note data."""
        if not self.title:
            raise ValueError("Title is required")
        if not self.content:
            raise ValueError("Content is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
            
    def to_dict(self):
        """Convert note to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'user_id': self.user_id,
            'universe_id': self.universe_id,
            'scene_id': self.scene_id,
            'character_id': self.character_id,
            'tags': self.tags,
            'is_public': self.is_public,
            'is_archived': self.is_archived,
            'position': {'x': self.position_x, 'y': self.position_y, 'z': self.position_z},
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }
        
    def archive(self):
        """Archive the note."""
        self.is_archived = True
        self.save()
        
    def unarchive(self):
        """Unarchive the note."""
        self.is_archived = False
        self.save()
        
    def make_public(self):
        """Make the note public."""
        self.is_public = True
        self.save()
        
    def make_private(self):
        """Make the note private."""
        self.is_public = False
        self.save()
        
    def add_tag(self, tag):
        """Add a tag to the note."""
        if not self.tags:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)
            self.save()
            
    def remove_tag(self, tag):
        """Remove a tag from the note."""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
            self.save()
            
    def update_position(self, x, y, z):
        """Update the note's position in 3D space."""
        self.position_x = x
        self.position_y = y
        self.position_z = z
        self.save() 