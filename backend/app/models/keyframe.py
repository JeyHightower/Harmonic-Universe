class Keyframe(db.Model):
    __tablename__ = 'keyframes'

    id = db.Column(db.Integer, primary_key=True)
    timeline_id = db.Column(db.Integer, db.ForeignKey('timeline.id'), nullable=False)
    # ... other existing columns ...
