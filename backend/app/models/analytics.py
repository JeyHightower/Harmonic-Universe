from ..extensions import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class Analytics(db.Model):
    __tablename__ = 'analytics'

    id = db.Column(db.Integer, primary_key=True)
    metric_name = db.Column(db.String(100), nullable=False, index=True)
    metric_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, index=True, default=datetime.utcnow)
    tags = db.Column(JSONB, nullable=False, default=dict)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, metric_name, metric_value, timestamp=None, tags=None):
        self.metric_name = metric_name
        self.metric_value = float(metric_value)
        self.timestamp = timestamp or datetime.utcnow()
        self.tags = tags or {}

    def save(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_metrics_by_name(cls, metric_name, start_time=None, end_time=None):
        query = cls.query.filter_by(metric_name=metric_name)

        if start_time:
            query = query.filter(cls.timestamp >= start_time)
        if end_time:
            query = query.filter(cls.timestamp <= end_time)

        return query.order_by(cls.timestamp.desc()).all()

    @classmethod
    def get_metrics_by_tag(cls, tag_name, tag_value, start_time=None, end_time=None):
        query = cls.query.filter(cls.tags[tag_name].astext == str(tag_value))

        if start_time:
            query = query.filter(cls.timestamp >= start_time)
        if end_time:
            query = query.filter(cls.timestamp <= end_time)

        return query.order_by(cls.timestamp.desc()).all()

    @classmethod
    def get_unique_metric_names(cls):
        return [r[0] for r in db.session.query(cls.metric_name.distinct()).all()]

    @classmethod
    def get_unique_tag_values(cls, tag_name):
        return db.session.query(
            db.func.jsonb_object_keys(cls.tags[tag_name])
        ).distinct().all()

    def to_dict(self):
        return {
            'id': self.id,
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'timestamp': self.timestamp.isoformat(),
            'tags': self.tags,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Analytics {self.metric_name}={self.metric_value} at {self.timestamp}>'
