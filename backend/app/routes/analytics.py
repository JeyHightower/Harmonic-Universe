from datetime import datetime
from flask import Blueprint, jsonify, request
from app.services.core.analytics import analytics_service
from app.auth import require_auth
from flask_login import current_user, login_required
from app.models.universe import Universe
import time

bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@bp.route("/summary", methods=["GET"])
@require_auth
def get_summary():
    """Get analytics summary for the specified date range."""
    try:
        start_date = request.args.get("start")
        end_date = request.args.get("end")

        if not start_date or not end_date:
            return (
                jsonify({"error": "Missing required parameters: start and end dates"}),
                400,
            )

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        summary = analytics_service.get_summary(start, end)
        return jsonify({"summary": summary})

    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500


@bp.route("/track", methods=["POST"])
@require_auth
def track_metric():
    """Track a new metric."""
    try:
        data = request.get_json()

        if not data or "name" not in data or "value" not in data:
            return jsonify({"error": "Missing required fields: name and value"}), 400

        analytics_service.track_metric(
            name=data["name"], value=float(data["value"]), tags=data.get("tags")
        )

        return jsonify({"status": "success"})

    except ValueError as e:
        return jsonify({"error": f"Invalid value format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to track metric: {str(e)}"}), 500


@bp.route("/cleanup", methods=["POST"])
@require_auth
def cleanup_data():
    """Clean up old analytics data."""
    try:
        retention_days = request.json.get("retention_days", 90)
        analytics_service.cleanup_old_data(retention_days)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": f"Failed to clean up data: {str(e)}"}), 500


@bp.route('/api/analytics/user/<int:user_id>', methods=['GET'])
@login_required
def get_user_analytics(user_id):
    """Get analytics for a specific user"""
    # Check if user has access
    if current_user.id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    start_time = time.time()
    stats = analytics_service.get_user_stats(user_id)
    duration = (time.time() - start_time) * 1000  # Convert to milliseconds

    # Track performance
    analytics_service.track_performance(
        'user_analytics',
        duration,
        {'user_id': user_id}
    )

    return jsonify(stats)


@bp.route('/api/analytics/universe/<int:universe_id>', methods=['GET'])
@login_required
def get_universe_analytics(universe_id):
    """Get analytics for a specific universe"""
    universe = Universe.query.get_or_404(universe_id)

    # Check if user has access
    if not universe.is_accessible_by(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    start_time = time.time()
    stats = analytics_service.get_universe_stats(universe_id)
    duration = (time.time() - start_time) * 1000

    # Track performance
    analytics_service.track_performance(
        'universe_analytics',
        duration,
        {'universe_id': universe_id}
    )

    return jsonify(stats)


@bp.route('/api/analytics/system', methods=['GET'])
@login_required
def get_system_analytics():
    """Get system-wide analytics"""
    # Only admins can access system analytics
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    start_time = time.time()
    stats = analytics_service.get_system_stats()
    duration = (time.time() - start_time) * 1000

    # Track performance
    analytics_service.track_performance(
        'system_analytics',
        duration
    )

    return jsonify(stats)


@bp.route('/api/analytics/performance', methods=['GET'])
@login_required
def get_performance_analytics():
    """Get performance metrics"""
    # Only admins can access performance analytics
    if not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    hours = request.args.get('hours', default=24, type=int)

    start_time = time.time()
    metrics = analytics_service.get_performance_metrics(hours)
    duration = (time.time() - start_time) * 1000

    # Track performance of getting performance metrics
    analytics_service.track_performance(
        'performance_analytics',
        duration,
        {'hours': hours}
    )

    return jsonify(metrics)
