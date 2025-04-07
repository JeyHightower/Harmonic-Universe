from ...extensions import db
from .base import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any
from .character import Character, character_scenes
from .note import Note
from .audio import SoundProfile, AudioSample, MusicPiece
from .physics import PhysicsObject, Physics2D, Physics3D
from flask import current_app

class Universe(BaseModel):
    __tablename__ = 'universes'
    
    name: Mapped[str] = mapped_column(db.String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    user_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    sound_profile_id: Mapped[Optional[int]] = mapped_column(db.Integer, db.ForeignKey('sound_profiles.id', ondelete='SET NULL'), index=True)
    is_public: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    scenes: Mapped[List["Scene"]] = relationship('Scene', lazy=True, cascade='all, delete-orphan')
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
        self.validate_initialization(name, user_id)
        self.name = name
        self.description = description
        self.user_id = user_id
        self.sound_profile_id = sound_profile_id
        self.is_public = is_public
    
    def validate_initialization(self, name: str, user_id: int) -> None:
        """Validate initialization parameters."""
        if not name or len(name.strip()) == 0:
            raise ValueError("Name is required and cannot be empty")
        if not user_id:
            raise ValueError("User  ID is required")
    
    def validate(self) -> None:
        """Validate universe data."""
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Universe name is required and cannot be empty")
        if len(self.name) > 100:
            raise ValueError("Universe name cannot exceed 100 characters")
        if not self.user_id:
            raise ValueError("User  ID is required")
        if self.description and len(self.description) > 5000:
            raise ValueError("Description cannot exceed 5000 characters")
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert universe to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'sound_profile_id': self.sound_profile_id,
            'is_public': self.is_public,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'scenes_count': self.get_scenes_count(),
            'characters_count': self.get_characters_count(),
            'notes_count': self.get_notes_count()
        }
        
    def get_scenes_count(self) -> int:
        """Get the count of scenes in the universe."""
        try:
            return db.session.query(Scene).filter_by(universe_id=self.id, is_deleted=False).count()
        except Exception as e:
            print(f"Error getting scenes count for universe {self.id}: {str(e)}")
            return 0

    def get_characters_count(self) -> int:
        """Get the count of characters in the universe."""
        try:
            return db.session.query(Character).filter_by(universe_id=self.id, is_deleted=False).count()
        except Exception as e:
            print(f"Error getting characters count for universe {self.id}: {str(e)}")
            return 0

    def get_notes_count(self) -> int:
        """Get the count of notes in the universe."""
        try:
            query = text("SELECT COUNT(*) FROM notes WHERE universe_id = :universe_id AND is_deleted = 0")
            result = db.session.execute(query, {"universe_id": self.id})
            return result.scalar() or 0
        except Exception as e:
            print(f"Error getting notes count for universe {self.id}: {str(e)}")
            return 0

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

    @classmethod
    def repair_universe(cls, universe_id: int) -> Dict[str, Any]:
        """Special method to repair database issues with a universe."""
        try:
            universe = cls.query.get(universe_id)
            if not universe:
                return {'success': False, 'message': f'Universe with ID {universe_id} not found'}
            
            db.session.close()
            db.session.remove()
            
            with db.session.begin():
                cls.repair_scenes(universe_id)
                cls.repair_character_scenes(universe_id)
                cls.update_universe_record(universe)
                
            return {'success': True, 'message': f'Universe {universe_id} repaired'}
                
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'message': f'Error repairing universe: {str(e)}'}

    @classmethod
    def repair_scenes(cls, universe_id: int) -> None:
        """Repair orphaned or corrupted scenes."""
        repair_sql = text("""
            UPDATE scenes 
            SET is_deleted = true 
            WHERE universe_id = :universe_id AND 
                  (name IS NULL OR description IS NULL)
        """)
        db.session.execute(repair_sql, {'universe_id': universe_id})

    @classmethod
    def repair_character_scenes(cls, universe_id: int) -> None:
        """Fix character-scene relationships that reference deleted scenes."""
        repair_sql = text("""
            DELETE FROM character_scenes 
            WHERE scene_id IN (
                SELECT id FROM scenes 
                WHERE universe_id = :universe_id AND is_deleted = true
            )
        """)
        db.session.execute(repair_sql, {'universe_id': universe_id})

    @classmethod
    def update_universe_record(cls, universe) -> None:
        """Update the universe record to ensure it has valid data."""
        if not universe.name:
            universe.name = f"Repaired Universe {universe.id}"
        if not universe.description:
            universe.description = "This universe was automatically repaired."
        universe.save()


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
    universe: Mapped[Optional["Universe"]] = relationship('Universe', foreign_keys=[universe_id], lazy=True)
    notes: Mapped[List[Note]] = relationship('Note', backref='scene', lazy=True, cascade='all, delete-orphan')
    characters: Mapped[List[Character]] = relationship('Character', secondary=character_scenes, lazy=True)
    physics_objects: Mapped[List[PhysicsObject]] = relationship('PhysicsObject', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_2d: Mapped[List[Physics2D]] = relationship('Physics2D', backref='scene', lazy=True, cascade='all, delete-orphan')
    physics_3d: Mapped[List[Physics3D]] = relationship('Physics3D', backref='scene', lazy=True, cascade='all, delete-orphan')
    audio_samples: Mapped[List[AudioSample]] = relationship('AudioSample', backref='scene', lazy=True, cascade='all, delete-orphan')
    music_pieces: Mapped[List[MusicPiece]] = relationship('MusicPiece', backref='scene', lazy=True, cascade='all, delete-orphan')
    
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
            'universe_id': self.universe_id,
            'is_public': self.is_public,
            'is_deleted': self.is_deleted,
            'characters_count': self.get_characters_count(),
            'notes_count': self.get_notes_count(),
            **self.get_optional_fields()
        }

    def get_characters_count(self) -> int:
        """Get the count of characters in the scene."""
        try:
            stmt = db.session.query(func.count()).select_from(Character).join(character_scenes).filter(character_scenes.c.scene_id == self.id)
            result = db.session.execute(stmt)
            return result.scalar() or 0
        except Exception as e:
            print(f"Error counting characters for scene {self.id}: {str(e)}")
            return 0

    def get_notes_count(self) -> int:
        """Get the count of notes in the scene."""
        try:
            query = text("SELECT COUNT(*) FROM notes WHERE scene_id = :scene_id AND is_deleted = 0")
            result = db.session.execute(query, {"scene_id": self.id})
            return result.scalar() or 0
        except Exception as e:
            print(f"Error counting notes for scene {self.id}: {str(e)}")
            return 0

    def get_optional_fields(self) -> Dict[str, Any]:
        """Get optional fields for the scene dictionary."""
        optional_fields = {}
        for field in ['description', 'summary', 'content', 'notes_text', 'location', 'scene_type', 'time_of_day', 'status', 'significance', 'date_of_scene']:
            value = getattr(self, field, None)
            if value is not None:
                optional_fields[field] = str(value)
        for field in ['order', 'sound_profile_id']:
            value = getattr(self, field, None)
            if value is not None:
                optional_fields[field] = value
        return optional_fields

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