from sqlalchemy.orm import relationship

class User:
    # Add these relationships to the User model
    audio_files = relationship("AudioFile", back_populates="user", cascade="all, delete-orphan")
    visualizations = relationship("Visualization", back_populates="user", cascade="all, delete-orphan")
    ai_models = relationship("AiModel", back_populates="user", cascade="all, delete-orphan")
