from app.extensions import db
from .base import BaseModel
from sqlalchemy import func, and_, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from .character import Character, character_scenes
from .note import Note
from .audio import SoundProfile, AudioSample, MusicPiece
from .physics import PhysicsObject, Physics2D, Physics3D
from flask import current_app

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
        # Initialize with default values
        scenes_count = 0
        characters_count = 0
        notes_count = 0
        
        try:
            # Safely get scenes count
            scenes_count = db.session.query(Scene).filter_by(
                universe_id=self.id,
                is_deleted=False
            ).count()
        except Exception as e:
            # Log error but continue
            print(f"Error getting scenes count for universe {self.id}: {str(e)}")

        try:
            # Safely get characters count
            characters_count = db.session.query(Character).filter_by(
                universe_id=self.id,
                is_deleted=False
            ).count()
        except Exception as e:
            # Log error but continue
            print(f"Error getting characters count for universe {self.id}: {str(e)}")

        try:
            # Safely get notes count
            notes_count = db.session.query(Note).filter_by(
                universe_id=self.id,
                is_deleted=False
            ).count()
        except Exception as e:
            # Log error but continue
            print(f"Error getting notes count for universe {self.id}: {str(e)}")

        try:
            # Create a dictionary with all the universe attributes
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
                'scenes_count': scenes_count,
                'characters_count': characters_count,
                'notes_count': notes_count
            }
        except Exception as e:
            # If there's an error creating the dictionary, return a simplified version
            print(f"Error creating dictionary for universe {self.id}: {str(e)}")
            return {
                'id': self.id,
                'name': str(self.name),
                'user_id': self.user_id,
                'is_public': bool(self.is_public),
                'is_deleted': bool(self.is_deleted) if hasattr(self, 'is_deleted') else False,
                'error': "Error generating complete universe data"
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

    @classmethod
    def repair_universe(cls, universe_id: int) -> Dict[str, Any]:
        """Special method to repair database issues with a universe."""
        try:
            # First check if universe exists
            universe = cls.query.get(universe_id)
            if not universe:
                return {
                    'success': False,
                    'message': f'Universe with ID {universe_id} not found'
                }
            
            # Try to fix any database issues with a clean transaction
            from sqlalchemy import text
            from app.extensions import db
            
            # Make sure any existing transaction is cleaned up
            db.session.close()
            db.session.remove()
            
            # Start fresh transaction for repair
            with db.session.begin():
                # 1. Check scenes table for orphaned or corrupted entries
                repair_sql = text("""
                    UPDATE scenes 
                    SET is_deleted = true 
                    WHERE universe_id = :universe_id AND 
                          (name IS NULL OR description IS NULL)
                """)
                
                result = db.session.execute(repair_sql, {'universe_id': universe_id})
                affected_rows = result.rowcount
                
                # 2. Clean up any problematic scene-character associations
                cleanup_sql = text("""
                    DELETE FROM character_scenes
                    WHERE scene_id IN (
                        SELECT id FROM scenes 
                        WHERE universe_id = :universe_id AND is_deleted = true
                    )
                """)
                
                char_result = db.session.execute(cleanup_sql, {'universe_id': universe_id})
                cleaned_assocs = char_result.rowcount
                
                # Force commit
                db.session.commit()
                
                return {
                    'success': True,
                    'message': f'Universe {universe_id} repaired',
                    'fixed_scenes': affected_rows,
                    'cleaned_associations': cleaned_assocs
                }
                
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Error repairing universe: {str(e)}'
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
        # Default values for safety
        characters_count = 0
        notes_count = 0
        
        try:
            # Try to safely get counts only if we have a valid ID and are in a database session
            if hasattr(self, 'id') and self.id is not None and db.session.is_active:
                try:
                    # Using a simpler query approach to avoid type issues
                    stmt = db.session.query(func.count()).select_from(Character).join(
                        character_scenes).filter(character_scenes.c.scene_id == self.id)
                    result = db.session.execute(stmt)
                    characters_count = result.scalar() or 0
                except Exception as e:
                    # Just log and continue with default count
                    print(f"Error counting characters for scene {self.id}: {str(e)}")
                    if current_app:
                        current_app.logger.error(f"Error counting characters for scene {self.id}: {str(e)}")
                
                try:
                    # Using a simpler query approach to avoid type issues
                    stmt = db.session.query(func.count()).select_from(Note).filter(
                        Note.scene_id == self.id, Note.is_deleted == False)
                    result = db.session.execute(stmt)
                    notes_count = result.scalar() or 0
                except Exception as e:
                    # Just log and continue with default count
                    print(f"Error counting notes for scene {self.id}: {str(e)}")
                    if current_app:
                        current_app.logger.error(f"Error counting notes for scene {self.id}: {str(e)}")
        except Exception as e:
            # Fail gracefully if counts can't be retrieved
            print(f"Error getting counts for scene {self.id if hasattr(self, 'id') else 'unknown'}: {str(e)}")
            if current_app:
                current_app.logger.error(f"Error getting counts for scene {self.id if hasattr(self, 'id') else 'unknown'}: {str(e)}")
        
        # Safely assemble the dictionary
        try:
            # Start with minimal safe attributes to ensure something is returned
            result = {
                'id': self.id if hasattr(self, 'id') else None,
                'name': str(self.name) if hasattr(self, 'name') and self.name is not None else "Unknown",
                'universe_id': self.universe_id if hasattr(self, 'universe_id') else None,
            }
            
            # Add boolean flags with explicit checks to avoid None errors
            try:
                result['is_public'] = bool(self.is_public) if hasattr(self, 'is_public') and self.is_public is not None else False
            except Exception:
                result['is_public'] = False
                
            try:
                result['is_deleted'] = bool(self.is_deleted) if hasattr(self, 'is_deleted') and self.is_deleted is not None else False
            except Exception:
                result['is_deleted'] = False
            
            # Only add counts if they were successfully retrieved
            result['characters_count'] = characters_count
            result['notes_count'] = notes_count
            
            # Add optional text fields with safety checks
            for field in ['description', 'summary', 'content', 'notes_text', 'location',
                          'scene_type', 'time_of_day', 'status', 'significance', 
                          'date_of_scene']:
                try:
                    if hasattr(self, field) and getattr(self, field) is not None:
                        result[field] = str(getattr(self, field))
                except Exception:
                    # Skip fields that cause errors
                    pass
            
            # Add optional numeric fields
            for field in ['order', 'sound_profile_id']:
                try:
                    if hasattr(self, field) and getattr(self, field) is not None:
                        result[field] = getattr(self, field)
                except Exception:
                    # Skip fields that cause errors
                    pass
            
            # Format dates as strings with explicit error handling
            for date_field in ['created_at', 'updated_at']:
                try:
                    if hasattr(self, date_field) and getattr(self, date_field) is not None:
                        result[date_field] = str(getattr(self, date_field))
                except Exception:
                    # Skip date fields that cause errors
                    pass
                
            return result
            
        except Exception as e:
            # Capture traceback for detailed debugging
            import traceback
            error_trace = traceback.format_exc()
            
            # If conversion fails completely, return absolute minimal data
            print(f"Critical error creating dictionary for scene: {str(e)}\n{error_trace}")
            if current_app:
                current_app.logger.error(f"Critical error creating dictionary for scene: {str(e)}")
                current_app.logger.error(error_trace)
                
            # Last resort fallback with minimal required fields
            fallback = {
                'id': self.id if hasattr(self, 'id') else None,
                'name': "Error: Scene data could not be loaded",
                'universe_id': self.universe_id if hasattr(self, 'universe_id') else None,
                'error': "Error generating scene data"
            }
            return fallback
        
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