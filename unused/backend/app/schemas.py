from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields
from app.models import (
    Universe,
    PhysicsParameters,
    MusicParameters,
    AudioParameters,
    VisualizationParameters,
)


class PhysicsParametersSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = PhysicsParameters
        include_fk = True
        load_instance = True


class MusicParametersSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MusicParameters
        include_fk = True
        load_instance = True


class AudioParametersSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = AudioParameters
        include_fk = True
        load_instance = True


class VisualizationParametersSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = VisualizationParameters
        include_fk = True
        load_instance = True


class UniverseSchema(SQLAlchemyAutoSchema):
    physics_parameters = fields.Nested(PhysicsParametersSchema)
    music_parameters = fields.Nested(MusicParametersSchema)
    audio_parameters = fields.Nested(AudioParametersSchema)
    visualization_parameters = fields.Nested(VisualizationParametersSchema)

    class Meta:
        model = Universe
        include_fk = True
        load_instance = True
