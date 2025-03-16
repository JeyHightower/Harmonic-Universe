"""
Health check endpoints.
"""

from flask import Blueprint, jsonify

# Define the blueprint here instead of importing it
health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint.
    Returns a simple status message to indicate the API is running.
    """
    return jsonify({"status": "ok"})
