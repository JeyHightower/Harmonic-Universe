from ..database import db

# Association table for Character-Scene relationship
character_scenes = db.Table('character_scenes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.id'), primary_key=True),
    db.Column('scene_id', db.Integer, db.ForeignKey('scenes.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=db.func.current_timestamp())
)

# Association table for MusicPiece-AudioSample relationship
music_audio_samples = db.Table('music_audio_samples',
    db.Column('music_piece_id', db.Integer, db.ForeignKey('music_pieces.id'), primary_key=True),
    db.Column('audio_sample_id', db.Integer, db.ForeignKey('audio_samples.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=db.func.current_timestamp())
) 