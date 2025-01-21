from flask import Blueprint, request, jsonify
from ..extensions import cache
from ..models.analytics import Analytics
from ..utils.error_handlers import handle_db_error
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics', methods=['POST'])
def track_analytics():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'value', 'timestamp', 'tags']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields'
            }), 400

        # Create analytics record
        analytics = Analytics(
            metric_name=data['name'],
            metric_value=data['value'],
            timestamp=datetime.fromtimestamp(data['timestamp'] / 1000.0),
            tags=data['tags']
        )

        # Save to database
        analytics.save()

        # Clear cache for aggregated metrics
        cache.delete('analytics_summary')

        return jsonify({
            'message': 'Analytics recorded successfully',
            'id': str(analytics.id)
        }), 201

    except Exception as e:
        return handle_db_error(e)

@analytics_bp.route('/api/analytics/summary', methods=['GET'])
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
                    'total': 0,
                    'count': 0,
                    'min': float('inf'),
                    'max': float('-inf'),
                    'tags': {}
                }

            entry = summary[metric.metric_name]
            value = float(metric.metric_value)

            entry['total'] += value
            entry['count'] += 1
            entry['min'] = min(entry['min'], value)
            entry['max'] = max(entry['max'], value)

            # Aggregate by tags
            for tag, tag_value in metric.tags.items():
                if tag not in entry['tags']:
                    entry['tags'][tag] = {}
                if tag_value not in entry['tags'][tag]:
                    entry['tags'][tag][tag_value] = 0
                entry['tags'][tag][tag_value] += 1

        # Calculate averages
        for metric_name, data in summary.items():
            if data['count'] > 0:
                data['average'] = data['total'] / data['count']

        return jsonify({
            'summary': summary,
            'total_metrics': len(metrics),
            'unique_metrics': len(summary),
            'generated_at': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return handle_db_error(e)
