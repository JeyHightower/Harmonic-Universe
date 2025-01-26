from datetime import datetime, timedelta
import json
from typing import Dict, Optional, List, Any
from sqlalchemy import func, and_, desc
from app.models.base import Analytics
from app.models.universe import Universe
from app.models.activity import Activity
from app.models.user import User
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
        metrics = (
            db.session.query(
                Analytics.name,
                func.count(Analytics.id).label("count"),
                func.avg(Analytics.value).label("average"),
                func.min(Analytics.value).label("min"),
                func.max(Analytics.value).label("max"),
                func.sum(Analytics.value).label("total"),
            )
            .filter(
                and_(Analytics.timestamp >= start_date, Analytics.timestamp <= end_date)
            )
            .group_by(Analytics.name)
            .all()
        )

        # Build summary
        summary = {}
        for metric in metrics:
            summary[metric.name] = {
                "count": metric.count,
                "average": float(metric.average),
                "min": float(metric.min),
                "max": float(metric.max),
                "total": float(metric.total),
                "tags": self._get_tag_distribution(metric.name, start_date, end_date),
            }

        # Cache the results
        self.cache.setex(cache_key, self.cache_ttl, json.dumps(summary))

        return summary

    def _get_tag_distribution(
        self, metric_name: str, start_date: datetime, end_date: datetime
    ) -> Dict:
        """Get tag distribution for a specific metric."""
        analytics = (
            db.session.query(Analytics)
            .filter(
                and_(
                    Analytics.name == metric_name,
                    Analytics.timestamp >= start_date,
                    Analytics.timestamp <= end_date,
                )
            )
            .all()
        )

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
            name=name, value=value, timestamp=datetime.utcnow(), tags=tags or {}
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

        db.session.query(Analytics).filter(Analytics.timestamp < cutoff_date).delete()

        db.session.commit()

    @staticmethod
    @cache.memoize(timeout=300)  # Cache for 5 minutes
    def get_user_stats(user_id: int) -> Dict[str, Any]:
        """Get statistics for a specific user"""
        user = User.query.get(user_id)
        if not user:
            return {}

        # Get user's universes
        universes = Universe.query.filter_by(creator_id=user_id).all()
        universe_count = len(universes)

        # Get recent activities
        recent_activities = Activity.query.filter_by(user_id=user_id)\
            .order_by(desc(Activity.timestamp))\
            .limit(10)\
            .all()

        # Calculate active time
        if recent_activities:
            last_active = recent_activities[0].timestamp
            active_since = user.created_at
            active_days = (last_active - active_since).days
        else:
            active_days = 0

        return {
            'universe_count': universe_count,
            'recent_activities': [activity.to_dict() for activity in recent_activities],
            'active_days': active_days,
            'joined_date': user.created_at.isoformat()
        }

    @staticmethod
    @cache.memoize(timeout=600)  # Cache for 10 minutes
    def get_universe_stats(universe_id: int) -> Dict[str, Any]:
        """Get statistics for a specific universe"""
        universe = Universe.query.get(universe_id)
        if not universe:
            return {}

        # Get activity counts by type
        activities = Activity.query.filter_by(universe_id=universe_id).all()
        activity_counts = {}
        for activity in activities:
            activity_counts[activity.action] = activity_counts.get(activity.action, 0) + 1

        # Get unique visitors
        unique_users = db.session.query(func.count(func.distinct(Activity.user_id)))\
            .filter(Activity.universe_id == universe_id)\
            .scalar()

        # Get parameter update frequency
        param_updates = Activity.query.filter_by(
            universe_id=universe_id,
            action='updated',
            target='parameters'
        ).count()

        return {
            'total_activities': len(activities),
            'activity_breakdown': activity_counts,
            'unique_visitors': unique_users,
            'parameter_updates': param_updates,
            'created_at': universe.created_at.isoformat(),
            'last_modified': universe.updated_at.isoformat()
        }

    @staticmethod
    @cache.memoize(timeout=3600)  # Cache for 1 hour
    def get_system_stats() -> Dict[str, Any]:
        """Get system-wide statistics"""
        # Get total counts
        total_users = User.query.count()
        total_universes = Universe.query.count()
        total_activities = Activity.query.count()

        # Get active users in last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_users = db.session.query(func.count(func.distinct(Activity.user_id)))\
            .filter(Activity.timestamp > yesterday)\
            .scalar()

        # Get most active universes
        active_universes = db.session.query(
            Activity.universe_id,
            func.count(Activity.id).label('activity_count')
        )\
            .group_by(Activity.universe_id)\
            .order_by(desc('activity_count'))\
            .limit(5)\
            .all()

        return {
            'total_users': total_users,
            'total_universes': total_universes,
            'total_activities': total_activities,
            'active_users_24h': active_users,
            'top_universes': [
                {
                    'universe_id': universe_id,
                    'activity_count': count
                }
                for universe_id, count in active_universes
            ]
        }

    @staticmethod
    def track_performance(event_type: str, duration: float, metadata: Dict = None) -> None:
        """Track performance metrics"""
        performance_data = {
            'event_type': event_type,
            'duration_ms': duration,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }

        # Store in cache for aggregation
        cache_key = f'performance_{datetime.utcnow().strftime("%Y%m%d_%H")}'
        current_data = cache.get(cache_key) or []
        current_data.append(performance_data)
        cache.set(cache_key, current_data, timeout=3600)  # Store for 1 hour

    @staticmethod
    def get_performance_metrics(hours: int = 24) -> Dict[str, Any]:
        """Get aggregated performance metrics"""
        metrics = []
        start_time = datetime.utcnow() - timedelta(hours=hours)

        # Collect data from cache
        while start_time <= datetime.utcnow():
            cache_key = f'performance_{start_time.strftime("%Y%m%d_%H")}'
            hour_data = cache.get(cache_key) or []
            metrics.extend(hour_data)
            start_time += timedelta(hours=1)

        if not metrics:
            return {}

        # Calculate statistics
        event_stats = {}
        for metric in metrics:
            event_type = metric['event_type']
            duration = metric['duration_ms']

            if event_type not in event_stats:
                event_stats[event_type] = {
                    'count': 0,
                    'total_duration': 0,
                    'min_duration': float('inf'),
                    'max_duration': 0
                }

            stats = event_stats[event_type]
            stats['count'] += 1
            stats['total_duration'] += duration
            stats['min_duration'] = min(stats['min_duration'], duration)
            stats['max_duration'] = max(stats['max_duration'], duration)

        # Calculate averages
        for event_type, stats in event_stats.items():
            stats['avg_duration'] = stats['total_duration'] / stats['count']

        return {
            'total_events': len(metrics),
            'event_stats': event_stats,
            'period_hours': hours
        }


analytics_service = AnalyticsService()
