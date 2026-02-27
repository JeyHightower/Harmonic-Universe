from config import db

character_universes = db.Table('character_universes',
    db.Column('character_id', db.Integer, db.ForeignKey('characters.character_id'), primary_key=True), 
    db.Column('universe_id', db.Integer, db.ForeignKey('universes.universe_id'), primary_key=True))


character_notes = db.Table('character_notes', 
db.Column('character_id', db.Integer, db.ForeignKey('characters.character_id'), primary_key=True),
db.Column('note_id', db.Integer, db.ForeignKey('notes.note_id'), primary_key = True))


note_universes = db.Table('note_universes',
db.Column('note_id', db.Integer, db.ForeignKey('notes.note_id'), primary_key=True),
db.Column('universe_id', db.Integer, db.ForeignKey('universes.universe_id'), primary_key=True))

character_locations = db.Table('character_locations',
db.Column('character_id', db.Integer, db.ForeignKey('characters.character_id'), primary_key=True),
db.Column('location_id', db.Integer, db.ForeignKey('locations.location_id'), primary_key=True))

location_notes = db.Table('location_notes',
db.Column('location_id', db.Integer, db.ForeignKey('locations.location_id'), primary_key=True),
db.Column('note_id', db.Integer, db.ForeignKey('notes.note_id'), primary_key=True))