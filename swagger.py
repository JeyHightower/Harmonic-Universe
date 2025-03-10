from flask_swagger_ui import get_swaggerui_blueprint
from flask import jsonify

# Set up Swagger UI
SWAGGER_URL = '/api/docs'
API_URL = '/api/swagger.json'

swagger_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Harmonic Universe API"
    }
)

def register_swagger(app):
    """Register Swagger UI blueprint with Flask app"""
    app.register_blueprint(swagger_blueprint, url_prefix=SWAGGER_URL)

    @app.route('/api/swagger.json')
    def swagger_json():
        """Serve the Swagger JSON specification"""
        return jsonify({
            "swagger": "2.0",
            "info": {
                "title": "Harmonic Universe API",
                "description": "API for Harmonic Universe application",
                "version": "1.0.0"
            },
            "basePath": "/api",
            "schemes": ["https"],
            "paths": {
                "/health": {
                    "get": {
                        "summary": "Health check endpoint",
                        "description": "Returns the health status of the API",
                        "produces": ["application/json"],
                        "responses": {
                            "200": {
                                "description": "Successful operation",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {
                                            "type": "string",
                                            "example": "ok"
                                        },
                                        "checks": {
                                            "type": "object"
                                        },
                                        "version": {
                                            "type": "string",
                                            "example": "1.0.0"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                # Add more endpoints here
            }
        })
