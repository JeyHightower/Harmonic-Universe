from sqlalchemy.orm import relationship

class Universe:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id')
        self.name = kwargs.get('name')
        self.scenes = kwargs.get('scenes', [])
        self.physics_parameters = kwargs.get('physics_parameters', [])
        self.audio_files = kwargs.get('audio_files', [])
        self.midi_sequences = kwargs.get('midi_sequences', [])
        self.audio_tracks = kwargs.get('audio_tracks', [])
        self.visualizations = kwargs.get('visualizations', [])
        self.ai_models = kwargs.get('ai_models', [])

    def __repr__(self):
        return f"<Universe(id={self.id}, name={self.name})>"

# Add these relationships to the Universe model
physics_parameters = relationship("PhysicsParameter", back_populates="universe", cascade="all, delete-orphan")
audio_files = relationship("AudioFile", back_populates="universe", cascade="all, delete-orphan")
midi_sequences = relationship("MidiSequence", back_populates="universe", cascade="all, delete-orphan")
audio_tracks = relationship("AudioTrack", back_populates="universe", cascade="all, delete-orphan")
visualizations = relationship("Visualization", back_populates="universe", cascade="all, delete-orphan")
