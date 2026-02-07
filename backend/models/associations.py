from . import db

users_universes = db.Table('users_universes',
    db.Column('user_id', db.Integer, db.ForeignKey('users.user_id'), primary_key=True), 
    db.Column('universe_id', db.Integer, db.ForeignKey('universes.universe_id'), primary_key=True))