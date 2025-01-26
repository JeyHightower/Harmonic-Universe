from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from ..extensions import cache
from ..models.analytics import Analytics
from ..models.universe import Universe
from ..models.user import User
from ..utils.error_handlers import handle_db_error
from datetime import datetime, timedelta

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/api/analytics", methods=["POST"])
def track_analytics():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["name", "value", "timestamp", "tags"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Create analytics record
        analytics = Analytics(
            metric_name=data["name"],
            metric_value=data["value"],
            timestamp=datetime.fromtimestamp(data["timestamp"] / 1000.0),
            tags=data["tags"],
        )

        # Save to database
        analytics.save()

        # Clear cache for aggregated metrics
        cache.delete("analytics_summary")

        return (
            jsonify(
                {"message": "Analytics recorded successfully", "id": str(analytics.id)}
            ),
            201,
        )

    except Exception as e:
        return handle_db_error(e)


@analytics_bp.route("/api/analytics/summary", methods=["GET"])
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_analytics_summary():
    try:
        # Get metrics from last 24 hours
        cutoff = datetime.utcnow() - timedelta(days=1)
        metrics = Analytics.query.filter(Analytics.timestamp >= cutoff).all()

        # Aggregate metrics
        summary = {}
        for metric in metrics:
            if metric.metric_name not in summary:
                summary[metric.metric_name] = {
                    "total": 0,
                    "count": 0,
                    "min": float("inf"),
                    "max": float("-inf"),
                    "tags": {},
                }

            entry = summary[metric.metric_name]
            value = float(metric.metric_value)

            entry["total"] += value
            entry["count"] += 1
            entry["min"] = min(entry["min"], value)
            entry["max"] = max(entry["max"], value)

            # Aggregate by tags
            for tag, tag_value in metric.tags.items():
                if tag not in entry["tags"]:
                    entry["tags"][tag] = {}
                if tag_value not in entry["tags"][tag]:
                    entry["tags"][tag][tag_value] = 0
                entry["tags"][tag][tag_value] += 1

        # Calculate averages
        for metric_name, data in summary.items():
            if data["count"] > 0:
                data["average"] = data["total"] / data["count"]

        return (
            jsonify(
                {
                    "summary": summary,
                    "total_metrics": len(metrics),
                    "unique_metrics": len(summary),
                    "generated_at": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        return handle_db_error(e)


@analytics_bp.route("/api/analytics/system", methods=["GET"])
@login_required
def get_system_analytics():
    """Get system-wide analytics."""
    try:
        # Get cached analytics or compute new ones
        analytics = cache.get('system_analytics')
        if not analytics:
            analytics = {
                'total_users': User.query.count(),
                'total_universes': Universe.query.count(),
                'active_simulations': Universe.query.filter_by(is_active=True).count(),
                'total_collaborations': Universe.query.filter(Universe.collaborators.any()).count()
            }
            cache.set('system_analytics', analytics, timeout=300)  # Cache for 5 minutes
        return jsonify(analytics), 200
    except Exception as e:
        return handle_db_error(e)


@analytics_bp.route("/api/analytics/universe/<int:universe_id>", methods=["GET"])
@login_required
def get_universe_analytics(universe_id):
    """Get analytics for a specific universe."""
    try:
        universe = Universe.query.get_or_404(universe_id)
        if universe.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Get cached analytics or compute new ones
        cache_key = f'universe_analytics_{universe_id}'
        analytics = cache.get(cache_key)
        if not analytics:
            analytics = {
                'total_simulations': universe.simulation_count,
                'total_collaborators': len(universe.collaborators),
                'total_parameters_updates': universe.parameter_update_count,
                'last_active': universe.last_active.isoformat() if universe.last_active else None,
                'activity_breakdown': {
                    'physics_updates': universe.physics_update_count,
                    'music_updates': universe.music_update_count,
                    'visual_updates': universe.visual_update_count
                },
                'recent_activity': universe.get_recent_activity()
            }
            cache.set(cache_key, analytics, timeout=300)  # Cache for 5 minutes
        return jsonify(analytics), 200
    except Exception as e:
        return handle_db_error(e)


@analytics_bp.route("/api/analytics/user/<int:user_id>", methods=["GET"])
@login_required
def get_user_analytics(user_id):
    """Get analytics for a specific user."""
    try:
        if user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Get cached analytics or compute new ones
        cache_key = f'user_analytics_{user_id}'
        analytics = cache.get(cache_key)
        if not analytics:
            user = User.query.get_or_404(user_id)
            analytics = {
                'total_universes': Universe.query.filter_by(user_id=user_id).count(),
                'total_collaborations': user.collaboration_count,
                'total_simulations': user.simulation_count,
                'member_since': user.created_at.isoformat(),
                'last_active': user.last_active.isoformat() if user.last_active else None,
                'recent_activity': user.get_recent_activity()
            }
            cache.set(cache_key, analytics, timeout=300)  # Cache for 5 minutes
        return jsonify(analytics), 200
    except Exception as e:
        return handle_db_error(e)


@analytics_bp.route("/api/analytics/performance", methods=["GET"])
@login_required
def get_performance_metrics():
    """Get system performance metrics."""
    try:
        # Get cached metrics or compute new ones
        metrics = cache.get('performance_metrics')
        if not metrics:
            metrics = {
                'cpu_usage': Analytics.get_cpu_usage(),
                'memory_usage': Analytics.get_memory_usage(),
                'active_websockets': Analytics.get_active_websockets(),
                'request_latency': Analytics.get_average_latency(),
                'error_rate': Analytics.get_error_rate()
            }
            cache.set('performance_metrics', metrics, timeout=60)  # Cache for 1 minute
        return jsonify(metrics), 200
    except Exception as e:
        return handle_db_error(e)
