from .base import BaseModel
from ..models.database import db

# Association table for character-scene many-to-many relationship
character_scenes = db.Table('character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id', ondelete='CASCADE'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id', ondelete='CASCADE'), primary_key=True)
)

class Character(BaseModel):
    __tablename__ = 'characters'
    
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    universe_id = db.Column(db.Integer, db.ForeignKey('universes.id', ondelete='CASCADE'), nullable=False, index=True)
    position_x = db.Column(db.Float, nullable=False, default=0.0)
    position_y = db.Column(db.Float, nullable=False, default=0.0)
    position_z = db.Column(db.Float, nullable=False, default=0.0)
    rotation_x = db.Column(db.Float, nullable=False, default=0.0)
    rotation_y = db.Column(db.Float, nullable=False, default=0.0)
    rotation_z = db.Column(db.Float, nullable=False, default=0.0)
    scale_x = db.Column(db.Float, nullable=False, default=1.0)
    scale_y = db.Column(db.Float, nullable=False, default=1.0)
    scale_z = db.Column(db.Float, nullable=False, default=1.0)
    model_path = db.Column(db.String(255))
    texture_path = db.Column(db.String(255))
    animation_path = db.Column(db.String(255))
    is_player = db.Column(db.Boolean, nullable=False, default=False)
    health = db.Column(db.Integer, nullable=False, default=100)
    max_health = db.Column(db.Integer, nullable=False, default=100)
    level = db.Column(db.Integer, nullable=False, default=1)
    experience = db.Column(db.Integer, nullable=False, default=0)
    attributes = db.Column(db.JSON)  # Store character attributes
    inventory = db.Column(db.JSON)  # Store character inventory
    equipment = db.Column(db.JSON)  # Store equipped items
    skills = db.Column(db.JSON)  # Store character skills
    quests = db.Column(db.JSON)  # Store active quests
    dialogue = db.Column(db.JSON)  # Store dialogue options
    behavior = db.Column(db.JSON)  # Store AI behavior settings
    
    def validate(self):
        """Validate character data."""
        if not self.name:
            raise ValueError("Name is required")
        if not self.universe_id:
            raise ValueError("Universe ID is required")
        if self.health < 0:
            raise ValueError("Health cannot be negative")
        if self.max_health < 1:
            raise ValueError("Max health must be positive")
        if self.level < 1:
            raise ValueError("Level must be positive")
        if self.experience < 0:
            raise ValueError("Experience cannot be negative")
            
    def to_dict(self):
        """Convert character to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'universe_id': self.universe_id,
            'position': {'x': self.position_x, 'y': self.position_y, 'z': self.position_z},
            'rotation': {'x': self.rotation_x, 'y': self.rotation_y, 'z': self.rotation_z},
            'scale': {'x': self.scale_x, 'y': self.scale_y, 'z': self.scale_z},
            'model_path': self.model_path,
            'texture_path': self.texture_path,
            'animation_path': self.animation_path,
            'is_player': self.is_player,
            'health': self.health,
            'max_health': self.max_health,
            'level': self.level,
            'experience': self.experience,
            'attributes': self.attributes,
            'inventory': self.inventory,
            'equipment': self.equipment,
            'skills': self.skills,
            'quests': self.quests,
            'dialogue': self.dialogue,
            'behavior': self.behavior,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_deleted': self.is_deleted
        }
        
    def take_damage(self, amount):
        """Apply damage to character."""
        if amount < 0:
            raise ValueError("Damage amount cannot be negative")
        self.health = max(0, self.health - amount)
        self.save()
        
    def heal(self, amount):
        """Heal character."""
        if amount < 0:
            raise ValueError("Heal amount cannot be negative")
        self.health = min(self.max_health, self.health + amount)
        self.save()
        
    def gain_experience(self, amount):
        """Add experience points to character."""
        if amount < 0:
            raise ValueError("Experience amount cannot be negative")
        self.experience += amount
        # Check for level up
        while self.experience >= self.get_experience_for_next_level():
            self.level_up()
        self.save()
        
    def level_up(self):
        """Level up the character."""
        self.level += 1
        self.max_health += 10
        self.health = self.max_health
        self.experience -= self.get_experience_for_next_level()
        
    def get_experience_for_next_level(self):
        """Calculate experience needed for next level."""
        return 100 * (self.level ** 1.5)  # Simple exponential formula 