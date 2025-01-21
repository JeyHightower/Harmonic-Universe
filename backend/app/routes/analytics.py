from datetime import datetime
from flask import Blueprint, jsonify, request
from app.services.analytics import analytics_service
from app.auth import require_auth

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@bp.route('/summary', methods=['GET'])
@require_auth
def get_summary():
    """Get analytics summary for the specified date range."""
    try:
        start_date = request.args.get('start')
        end_date = request.args.get('end')

        if not start_date or not end_date:
            return jsonify({
                'error': 'Missing required parameters: start and end dates'
            }), 400

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        summary = analytics_service.get_summary(start, end)
        return jsonify({'summary': summary})

    except ValueError as e:
        return jsonify({
            'error': f'Invalid date format: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Failed to fetch analytics: {str(e)}'
        }), 500

@bp.route('/track', methods=['POST'])
@require_auth
def track_metric():
    """Track a new metric."""
    try:
        data = request.get_json()

        if not data or 'name' not in data or 'value' not in data:
            return jsonify({
                'error': 'Missing required fields: name and value'
            }), 400

        analytics_service.track_metric(
            name=data['name'],
            value=float(data['value']),
            tags=data.get('tags')
        )

        return jsonify({'status': 'success'})

    except ValueError as e:
        return jsonify({
            'error': f'Invalid value format: {str(e)}'
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Failed to track metric: {str(e)}'
        }), 500

@bp.route('/cleanup', methods=['POST'])
@require_auth
def cleanup_data():
    """Clean up old analytics data."""
    try:
        retention_days = request.json.get('retention_days', 90)
        analytics_service.cleanup_old_data(retention_days)
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({
            'error': f'Failed to clean up data: {str(e)}'
        }), 500
