from flask import Blueprint, jsonify, request, send_file
from flask_login import current_user, login_required
from app.models.universe import Universe
import json
import csv
from io import StringIO, BytesIO
import pandas as pd
from datetime import datetime

export_bp = Blueprint('export', __name__)

@export_bp.route('/api/universes/<int:id>/export', methods=['GET'])
@login_required
def export_universe(id):
    """Export universe data in the requested format."""
    universe = Universe.query.get_or_404(id)
    if universe.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    export_format = request.args.get('format', 'json')
    include_params = request.args.get('include_params', 'true').lower() == 'true'
    include_history = request.args.get('include_history', 'false').lower() == 'true'

    # Prepare data for export
    data = {
        'id': universe.id,
        'name': universe.name,
        'description': universe.description,
        'created_at': universe.created_at.isoformat(),
        'updated_at': universe.updated_at.isoformat() if universe.updated_at else None,
    }

    if include_params:
        data['parameters'] = universe.parameters

    if include_history:
        data['history'] = [
            {
                'action': h.action,
                'timestamp': h.timestamp.isoformat(),
                'user_id': h.user_id
            }
            for h in universe.history
        ]

    # Export in requested format
    if export_format == 'json':
        return jsonify(data)

    elif export_format == 'csv':
        output = StringIO()
        writer = csv.writer(output)

        # Write headers
        headers = ['id', 'name', 'description', 'created_at', 'updated_at']
        if include_params:
            headers.extend(['physics_params', 'music_params', 'visual_params'])
        writer.writerow(headers)

        # Write data
        row = [
            universe.id,
            universe.name,
            universe.description,
            universe.created_at.isoformat(),
            universe.updated_at.isoformat() if universe.updated_at else None
        ]
        if include_params:
            params = universe.parameters
            row.extend([
                json.dumps(params.get('physics', {})),
                json.dumps(params.get('music', {})),
                json.dumps(params.get('visual', {}))
            ])
        writer.writerow(row)

        output.seek(0)
        return send_file(
            BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'universe_{universe.id}_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    elif export_format == 'excel':
        # Convert data to pandas DataFrame
        df = pd.DataFrame([data])
        if include_params:
            params = universe.parameters
            df['physics_params'] = json.dumps(params.get('physics', {}))
            df['music_params'] = json.dumps(params.get('music', {}))
            df['visual_params'] = json.dumps(params.get('visual', {}))

        # Create Excel file
        output = BytesIO()
        df.to_excel(output, index=False)
        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'universe_{universe.id}_{datetime.now().strftime("%Y%m%d")}.xlsx'
        )

    else:
        return jsonify({'error': 'Unsupported export format'}), 400

@export_bp.route('/api/export/parameters/<int:universe_id>', methods=['GET'])
@login_required
def export_parameters(universe_id):
    """Export specific parameter sets"""
    universe = Universe.query.get_or_404(universe_id)

    # Check if user has access to universe
    if not universe.is_accessible_by(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    param_type = request.args.get('type')  # 'physics', 'music', or 'visual'
    format = request.args.get('format', 'json')

    if param_type not in ['physics', 'music', 'visual']:
        return jsonify({'error': 'Invalid parameter type'}), 400

    # Get parameters based on type
    params = getattr(universe, f'{param_type}_params', {})

    if format == 'json':
        return jsonify(params)

    elif format == 'csv':
        # Convert parameters to DataFrame
        df = pd.DataFrame([params])

        # Create CSV
        output = StringIO()
        df.to_csv(output, index=False)

        # Prepare response
        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'universe_{universe_id}_{param_type}_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    else:
        return jsonify({'error': 'Invalid format'}), 400

@export_bp.route('/api/export/activity/<int:universe_id>', methods=['GET'])
@login_required
def export_activity(universe_id):
    """Export activity history"""
    universe = Universe.query.get_or_404(universe_id)

    # Check if user has access to universe
    if not universe.is_accessible_by(current_user):
        return jsonify({'error': 'Unauthorized'}), 403

    format = request.args.get('format', 'json')

    # Get activities
    activities = [activity.to_dict() for activity in universe.activities]

    if format == 'json':
        return jsonify(activities)

    elif format == 'csv':
        # Convert activities to DataFrame
        df = pd.DataFrame(activities)

        # Create CSV
        output = StringIO()
        df.to_csv(output, index=False)

        # Prepare response
        output.seek(0)
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'universe_{universe_id}_activity_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    else:
        return jsonify({'error': 'Invalid format'}), 400
