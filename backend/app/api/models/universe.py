from app.extensions import db
from .base import BaseModel
from sqlalchemy import func, and_, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from .character import Character, character_scenes
from .note import Note
from .audio import SoundProfile, AudioSample, MusicPiece
from .physics import PhysicsObject, Physics2D, Physics3D

if TYPE_CHECKING:
    from .universe import Universe

class Universe(BaseModel):
    __tablename__ = 'universes'
    
    name: Mapped[str] = mapped_column(db.String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id: Mapped[Optional[int]] = mapped_column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    scenes: Mapped[List['Scene']] = relationship('Scene', lazy=True, cascade='all, delete-orphan')
    notes: Mapped[List[Note]] = relationship('Note', backref='universe', lazy=True, cascade='all, delete-orphan')
    characters: Mapped[List[Character]] = relationship('Character', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_objects: Mapped[List[PhysicsObject]] = relationship('PhysicsObject', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_2d: Mapped[List[Physics2D]] = relationship('Physics2D', backref='universe', lazy=True, cascade='all, delete-orphan')
    physics_3d: Mapped[List[Physics3D]] = relationship('Physics3D', backref='universe', lazy=True, cascade='all, delete-orphan')
    audio_samples: Mapped[List[AudioSample]] = relationship('AudioSample', backref='universe', lazy=True, cascade='all, delete-orphan')
    music_pieces: Mapped[List[MusicPiece]] = relationship('MusicPiece', backref='universe', lazy=True, cascade='all, delete-orphan')
    sound_profile: Mapped[Optional[SoundProfile]] = relationship('SoundProfile', foreign_keys=[sound_profile_id], backref=db.backref('parent_universe', uselist=False), uselist=False, lazy=True)
    
    def __init__(self, name: str, user_id: int, description: Optional[str] = None, sound_profile_id: Optional[int] = None, is_public: bool = False) -> None:
        super().__init__()
        if not name or len(name.strip()) == 0:
            raise ValueError("Name is required and cannot be empty")
        if not user_id:
            raise ValueError("User ID is required")
        self.name = name
        self.description = description
        self.user_id = user_id
        self.sound_profile_id = sound_profile_id
        self.is_public = is_public
    
    def validate(self) -> None:
        """Validate universe data."""
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Universe name is required and cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Universe name cannot exceed 100 characters")
        if not self.user_id:
            raise ValueError("User ID is required")
        if self.description and len(self.description) > 5000:
            raise ValueError("Description cannot exceed 5000 characters")
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert universe to dictionary."""
        scenes_count = db.session.query(Scene).filter_by(
            universe_id=self.id,
            is_deleted=False
        ).count()

        characters_count = db.session.query(Character).filter_by(
            universe_id=self.id,
            is_deleted=False
        ).count()

        notes_count = db.session.query(Note).filter_by(
            universe_id=self.id,
            is_deleted=False
        ).count()

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted,
            'scenes_count': scenes_count,
            'characters_count': characters_count,
            'notes_count': notes_count
        }
        
    def get_scene_by_name(self, name: str) -> Optional['Scene']:
        """Get a scene by name."""
        return Scene.query.filter_by(universe_id=self.id, name=name, is_deleted=False).first()
        
    def add_scene(self, scene: 'Scene') -> None:
        """Add a scene to the universe."""
        if scene.universe_id != self.id:
            raise ValueError("Scene must belong to this universe")
        if not db.session.query(Scene).filter_by(id=scene.id, universe_id=self.id).first():
            self.scenes.append(scene)
            self.save()
        
    def remove_scene(self, scene: 'Scene') -> None:
        """Remove a scene from the universe."""
        if db.session.query(Scene).filter_by(id=scene.id, universe_id=self.id).first():
            self.scenes.remove(scene)
            self.save()
            
    def get_public_scenes(self) -> List['Scene']:
        """Get all public scenes in the universe."""
        return Scene.query.filter_by(universe_id=self.id, is_public=True, is_deleted=False).all()
        
    def get_character_by_name(self, name: str) -> Optional[Character]:
        """Get a character by name."""
        return Character.query.filter_by(universe_id=self.id, name=name, is_deleted=False).first()
        
    def add_character(self, character: Character) -> None:
        """Add a character to the universe."""
        if character.universe_id != self.id:
            raise ValueError("Character must belong to this universe")
        if not db.session.query(Character).filter_by(id=character.id, universe_id=self.id).first():
            self.characters.append(character)
            self.save()
        
    def remove_character(self, character: Character) -> None:
        """Remove a character from the universe."""
        if db.session.query(Character).filter_by(id=character.id, universe_id=self.id).first():
            self.characters.remove(character)
            self.save()
            
    def get_public_characters(self) -> List[Character]:
        """Get all public characters in the universe."""
        return Character.query.filter_by(universe_id=self.id, is_public=True, is_deleted=False).all()
        
    def get_note_by_title(self, title: str) -> Optional[Note]:
        """Get a note by title."""
        return Note.query.filter_by(universe_id=self.id, title=title, is_deleted=False).first()
        
    def add_note(self, note: Note) -> None:
        """Add a note to the universe."""
        if note.universe_id != self.id:
            raise ValueError("Note must belong to this universe")
        if not db.session.query(Note).filter_by(id=note.id, universe_id=self.id).first():
            self.notes.append(note)
            self.save()
        
    def remove_note(self, note: Note) -> None:
        """Remove a note from the universe."""
        if db.session.query(Note).filter_by(id=note.id, universe_id=self.id).first():
            self.notes.remove(note)
            self.save()
            
    def set_sound_profile(self, sound_profile: Optional[SoundProfile]) -> None:
        """Set the sound profile for the universe."""
        if sound_profile and sound_profile.user_id != self.user_id:
            raise ValueError("Sound profile must belong to the same user")
        self.sound_profile_id = sound_profile.id if sound_profile else None
        self.save()
        
    def remove_sound_profile(self) -> None:
        """Remove the sound profile from the universe."""
        self.sound_profile_id = None
        self.save()
        
    def make_public(self) -> None:
        """Make the universe public."""
        self.is_public = True
        self.save()
        
    def make_private(self) -> None:
        """Make the universe private."""
        self.is_public = False
        self.save()

class Scene(BaseModel):
    __tablename__ = 'scenes'
    
    name: Mapped[str] = mapped_column(db.String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    summary: Mapped[Optional[str]] = mapped_column(db.Text)
    content: Mapped[Optional[str]] = mapped_column(db.Text)
    notes_text: Mapped[Optional[str]] = mapped_column(db.Text)
    location: Mapped[Optional[str]] = mapped_column(db.String(200))
    scene_type: Mapped[Optional[str]] = mapped_column(db.String(50), default='default')
    time_of_day: Mapped[Optional[str]] = mapped_column(db.String(50))
    status: Mapped[Optional[str]] = mapped_column(db.String(50), default='draft')
    significance: Mapped[Optional[str]] = mapped_column(db.String(50), default='minor')
    date_of_scene: Mapped[Optional[str]] = mapped_column(db.String(50))
    order: Mapped[Optional[int]] = mapped_column(db.Integer, default=0)
    universe_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id: Mapped[Optional[int]] = mapped_column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    universe: Mapped[Optional[Universe]] = relationship('Universe', foreign_keys=[universe_id], lazy=True)
    notes: Mapped[List[Note]] = relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    characters: Mapped[List[Character]] = relationship('Character', secondary=character_scenes, lazy=True)
    physics_objects: Mapped[List[PhysicsObject]] = relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d: Mapped[List[Physics2D]] = relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d: Mapped[List[Physics3D]] = relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    audio_samples: Mapped[List[AudioSample]] = relationship('AudioSample', backref='scene', lazy=True, cascade='all, delete-orphan')
    music_pieces: Mapped[List[MusicPiece]] = relationship('MusicPiece', backref='scene', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, name: str, universe_id: int, description: Optional[str] = None, sound_profile_id: Optional[int] = None, is_public: bool = False) -> None:
        super().__init__()
        if not name or len(name.strip()) == 0:
            raise ValueError("Name is required and cannot be empty")
        if not universe_id:
            raise ValueError("Universe ID is required")
        self.name = name
        self.description = description
        self.universe_id = universe_id
        self.sound_profile_id = sound_profile_id
        self.is_public = is_public
    
    def validate(self) -> None:
        """Validate scene data."""
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Scene name is required and cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Scene name cannot exceed 100 characters")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if self.description and len(self.description) > 5000:
            raise ValueError("Description cannot exceed 5000 characters")
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert scene to dictionary."""
        # Count related records using proper SQL syntax
        characters_count = 0
        notes_count = 0
        
        try:
            # Try to safely get counts
            if self.id is not None:  # Only try counting if we have an ID (saved record)
                characters_count = db.session.query(func.count()).select_from(Character).join(
                    character_scenes).filter(character_scenes.c.scene_id == self.id).scalar() or 0
                notes_count = db.session.query(func.count()).select_from(Note).filter(
                    Note.scene_id == self.id).filter(Note.is_deleted == False).scalar() or 0
        except Exception as e:
            # Fail gracefully if counts can't be retrieved
            print(f"Error getting counts for scene {self.id}: {str(e)}")
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'summary': self.summary,
            'content': self.content,
            'notes': self.notes_text,  # Map notes_text back to notes for API consistency
            'location': self.location,
            'scene_type': self.scene_type,
            'time_of_day': self.time_of_day,
            'status': self.status,
            'significance': self.significance,
            'date_of_scene': self.date_of_scene,
            'order': self.order,
            'universe_id': self.universe_id,
            'sound_profile_id': self.sound_profile_id,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted,
            'characters_count': characters_count,
            'notes_count': notes_count
        }
        
    def get_character_by_name(self, name: str) -> Optional[Character]:
        """Get a character by name."""
        return Character.query.join(character_scenes).filter_by(scene_id=self.id, name=name, is_deleted=False).first()
        
    def add_character(self, character: Character) -> None:
        """Add a character to the scene."""
        if not db.session.query(Character).join(character_scenes).filter_by(scene_id=self.id, character_id=character.id).first():
            self.characters.append(character)
            self.save()
            
    def remove_character(self, character: Character) -> None:
        """Remove a character from the scene."""
        if db.session.query(Character).join(character_scenes).filter_by(scene_id=self.id, character_id=character.id).first():
            self.characters.remove(character)
            self.save()
            
    def get_note_by_title(self, title: str) -> Optional[Note]:
        """Get a note by title."""
        return Note.query.filter_by(scene_id=self.id, title=title, is_deleted=False).first()
        
    def add_note(self, note: Note) -> None:
        """Add a note to the scene."""
        if note.scene_id != self.id:
            raise ValueError("Note must belong to this scene")
        if not db.session.query(Note).filter_by(id=note.id, scene_id=self.id).first():
            self.notes.append(note)
            self.save()
        
    def remove_note(self, note: Note) -> None:
        """Remove a note from the scene."""
        if db.session.query(Note).filter_by(id=note.id, scene_id=self.id).first():
            self.notes.remove(note)
            self.save()
            
    def set_sound_profile(self, sound_profile: Optional[SoundProfile]) -> None:
        """Set the sound profile for the scene."""
        if sound_profile and self.universe and sound_profile.user_id != self.universe.user_id:
            raise ValueError("Sound profile must belong to the same user as the universe")
        self.sound_profile_id = sound_profile.id if sound_profile else None
        self.save()
        
    def remove_sound_profile(self) -> None:
        """Remove the sound profile from the scene."""
        self.sound_profile_id = None
        self.save()
        
    def make_public(self) -> None:
        """Make the scene public."""
        self.is_public = True
        self.save()
        
    def make_private(self) -> None:
        """Make the scene private."""
        self.is_public = False
        self.save() 