class Timeline(db.Model):
    __tablename__ = 'timeline'

    id = db.Column(db.Integer, primary_key=True)
    # ... other existing columns ...

    # Update the relationship definition to specify the foreign key
    keyframes = db.relationship('Keyframe',
                              backref='timeline',
                              lazy='dynamic',
                              cascade='all, delete-orphan')
