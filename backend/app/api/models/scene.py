from ...extensions import db
from .base import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship, class_mapper
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from .character import Character, character_scenes
from .note import Note
from .audio import SoundProfile, AudioSample, MusicPiece
from .physics import PhysicsObject, Physics2D, Physics3D, PhysicsParameters

# Import Universe only for type checking to avoid circular import
if TYPE_CHECKING:
    from .universe import Universe

# SceneNote class for associating notes specifically with scenes
class SceneNote(BaseModel):
    __tablename__ = 'scene_notes'

    title: Mapped[str] = mapped_column(db.String(100), nullable=False, index=True)
    content: Mapped[Optional[str]] = mapped_column(db.Text)
    scene_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), nullable=False, index=True)
    type: Mapped[Optional[str]] = mapped_column(db.String(50), default='general')
    importance: Mapped[Optional[str]] = mapped_column(db.String(50), default='normal')
    order: Mapped[Optional[int]] = mapped_column(db.Integer, default=0)
    is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)

    # Relationships
    scene: Mapped[Optional["Scene"]] = relationship('Scene', back_populates='scene_notes')

    def __init__(self, title: str, scene_id: int, content: Optional[str] = None, type: Optional[str] = 'general', is_public: bool = False):
        super().__init__()
        self.title = title
        self.scene_id = scene_id
        self.content = content
        self.type = type
        self.is_public = is_public

    def to_dict(self) -> Dict[str, Any]:
        """Convert scene note to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'scene_id': self.scene_id,
            'type': self.type,
            'importance': self.importance,
            'order': self.order,
            'is_public': self.is_public,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted
        }

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
    universe: Mapped[Optional["Universe"]] = relationship('Universe', back_populates='scenes', foreign_keys=[universe_id])
    notes: Mapped[List[Note]] = relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    scene_notes: Mapped[List["SceneNote"]] = relationship('SceneNote', back_populates='scene', lazy=True, cascade='all, delete-orphan')
    characters: Mapped[List[Character]] = relationship('Character', secondary=character_scenes, back_populates='scenes', lazy=True)
    physics_objects: Mapped[List[PhysicsObject]] = relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d: Mapped[List[Physics2D]] = relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d: Mapped[List[Physics3D]] = relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    audio_samples: Mapped[List[AudioSample]] = relationship('AudioSample', backref='scene', lazy=True, cascade='all, delete-orphan')
    music_pieces: Mapped[List[MusicPiece]] = relationship('MusicPiece', backref='scene', lazy=True, cascade='all, delete-orphan')
    sound_profile: Mapped[Optional[SoundProfile]] = relationship('SoundProfile', foreign_keys=[sound_profile_id], overlaps="universe_sound_profile", lazy=True)

    def __init__(self, name: str, universe_id: int, description: Optional[str] = None, sound_profile_id: Optional[int] = None, is_public: bool = False) -> None:
        super().__init__()
        self.validate_initialization(name, universe_id)
        self.name = name
        self.description = description
        self.universe_id = universe_id
        self.sound_profile_id = sound_profile_id
        self.is_public = is_public

    def validate_initialization(self, name: str, universe_id: int) -> None:
        """Validate initialization parameters."""
        if not name or len(name.strip()) == 0:
            raise ValueError("Name is required and cannot be empty")
        if not universe_id:
            raise ValueError("Universe ID is required")

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
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'is_public': self.is_public,
            **self.get_optional_fields()
        }

    def get_characters_count(self) -> int:
        """Get the count of characters in the scene."""
        try:
            if hasattr(self, 'characters'):
                return len([c for c in self.characters if not getattr(c, 'is_deleted', False)])
            query = text("SELECT COUNT(*) FROM character_scenes cs JOIN characters c ON cs.character_id = c.id WHERE cs.scene_id = :scene_id AND c.is_deleted = 0")
            result = db.session.execute(query, {"scene_id": self.id})
            return result.scalar() or 0
        except Exception as e:
            print(f"Error getting characters count for scene {self.id}: {str(e)}")
            return 0

    def get_notes_count(self) -> int:
        """Get the count of notes in the scene."""
        try:
            query = text("SELECT COUNT(*) FROM notes WHERE scene_id = :scene_id AND is_deleted = 0")
            result = db.session.execute(query, {"scene_id": self.id})
            return result.scalar() or 0
        except Exception as e:
            print(f"Error getting notes count for scene {self.id}: {str(e)}")
            return 0

    def get_optional_fields(self) -> Dict[str, Any]:
        """Get optional fields if they exist."""
        optional_fields = {}
        for field in ['summary', 'content', 'notes_text', 'location', 'scene_type',
                      'time_of_day', 'status', 'significance', 'date_of_scene', 'order']:
            if hasattr(self, field) and getattr(self, field) is not None:
                optional_fields[field] = getattr(self, field)
        return optional_fields

    def get_character_by_name(self, name: str) -> Optional[Character]:
        """Get a character by name."""
        return Character.query.join(character_scenes).filter(
            character_scenes.c.scene_id == self.id,
            class_mapper(Character).c.name == name,
            class_mapper(Character).c.is_deleted == False
        ).first()

    def add_character(self, character: Character) -> None:
        """Add a character to the scene."""
        if character not in self.characters:
            self.characters.append(character)
            self.save()

    def remove_character(self, character: Character) -> None:
        """Remove a character from the scene."""
        if character in self.characters:
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
        if sound_profile and self.universe and hasattr(self.universe, 'user_id'):
            if sound_profile.user_id != self.universe.user_id:
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
