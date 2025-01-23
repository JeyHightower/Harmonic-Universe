from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
from sqlalchemy import func, and_
from redis import Redis
from app.models.base import Analytics
from app.extensions import db, cache

class AnalyticsService:
    def __init__(self):
        self.cache = cache
        self.cache_ttl = 300  # 5 minutes

    def get_summary(self, start_date: datetime, end_date: datetime) -> Dict:
        """Get analytics summary for the given date range."""
        cache_key = f"analytics_summary:{start_date.isoformat()}:{end_date.isoformat()}"

        # Try to get from cache first
        cached = self.cache.get(cache_key)
        if cached:
            return json.loads(cached)

        # Query database for metrics
        metrics = db.session.query(
            Analytics.name,
            func.count(Analytics.id).label('count'),
            func.avg(Analytics.value).label('average'),
            func.min(Analytics.value).label('min'),
            func.max(Analytics.value).label('max'),
            func.sum(Analytics.value).label('total')
        ).filter(
            and_(
                Analytics.timestamp >= start_date,
                Analytics.timestamp <= end_date
            )
        ).group_by(Analytics.name).all()

        # Build summary
        summary = {}
        for metric in metrics:
            summary[metric.name] = {
                'count': metric.count,
                'average': float(metric.average),
                'min': float(metric.min),
                'max': float(metric.max),
                'total': float(metric.total),
                'tags': self._get_tag_distribution(metric.name, start_date, end_date)
            }

        # Cache the results
        self.cache.setex(
            cache_key,
            self.cache_ttl,
            json.dumps(summary)
        )

        return summary

    def _get_tag_distribution(self, metric_name: str, start_date: datetime, end_date: datetime) -> Dict:
        """Get tag distribution for a specific metric."""
        analytics = db.session.query(Analytics).filter(
            and_(
                Analytics.name == metric_name,
                Analytics.timestamp >= start_date,
                Analytics.timestamp <= end_date
            )
        ).all()

        tag_distribution = {}
        for record in analytics:
            if not record.tags:
                continue

            for tag_name, tag_value in record.tags.items():
                if tag_name not in tag_distribution:
                    tag_distribution[tag_name] = {}

                str_value = str(tag_value)
                if str_value not in tag_distribution[tag_name]:
                    tag_distribution[tag_name][str_value] = 0
                tag_distribution[tag_name][str_value] += 1

        return tag_distribution

    def track_metric(self, name: str, value: float, tags: Optional[Dict] = None):
        """Track a new metric."""
        metric = Analytics(
            name=name,
            value=value,
            timestamp=datetime.utcnow(),
            tags=tags or {}
        )

        db.session.add(metric)
        db.session.commit()

        # Invalidate relevant cache keys
        self._invalidate_cache(metric.timestamp)

    def _invalidate_cache(self, timestamp: datetime):
        """Invalidate cached summaries that include this timestamp."""
        # Get all cache keys matching the pattern
        pattern = "analytics_summary:*"
        keys = self.cache.keys(pattern)

        for key in keys:
            try:
                _, start, end = key.decode().split(":")
                start_date = datetime.fromisoformat(start)
                end_date = datetime.fromisoformat(end)

                if start_date <= timestamp <= end_date:
                    self.cache.delete(key)
            except (ValueError, AttributeError):
                continue

    def cleanup_old_data(self, retention_days: int = 90):
        """Clean up data older than retention period."""
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        db.session.query(Analytics).filter(
            Analytics.timestamp < cutoff_date
        ).delete()

        db.session.commit()

analytics_service = AnalyticsService()
