from . import db

character_universes = db.Table('character_universes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.character_id'), primary_key=True), 
    db.Column('universe_id', db.Integer, db.ForeignKey('universes.universe_id'), primary_key=True))