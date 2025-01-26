from functools import wraps
from flask import request, current_app, make_response


class SecurityHeaders:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        """Initialize the security headers for the Flask app."""

        @app.after_request
        def add_security_headers(response):
            # Content Security Policy
            csp = {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                "style-src": ["'self'", "'unsafe-inline'"],
                "img-src": ["'self'", "data:", "https:"],
                "font-src": ["'self'", "data:", "https:"],
                "connect-src": ["'self'", "wss:", "https:"],
                "frame-ancestors": ["'none'"],
                "form-action": ["'self'"],
                "base-uri": ["'self'"],
                "object-src": ["'none'"],
            }

            response.headers["Content-Security-Policy"] = self._build_csp(csp)

            # HTTP Strict Transport Security
            # max-age of two years in seconds
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=63072000; includeSubDomains; preload"

            # X-Content-Type-Options
            response.headers["X-Content-Type-Options"] = "nosniff"

            # X-Frame-Options
            response.headers["X-Frame-Options"] = "DENY"

            # X-XSS-Protection
            response.headers["X-XSS-Protection"] = "1; mode=block"

            # Referrer-Policy
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            # Permissions-Policy (formerly Feature-Policy)
            permissions = {
                "geolocation": ["'none'"],
                "microphone": ["'none'"],
                "camera": ["'none'"],
                "payment": ["'none'"],
                "usb": ["'none'"],
                "accelerometer": ["'none'"],
                "autoplay": ["'none'"],
                "document-domain": ["'none'"],
                "encrypted-media": ["'none'"],
                "fullscreen": ["'self'"],
                "magnetometer": ["'none'"],
                "midi": ["'none'"],
                "sync-xhr": ["'self'"],
            }

            response.headers["Permissions-Policy"] = self._build_permissions_policy(
                permissions
            )

            # Clear-Site-Data on logout
            if request.endpoint == "auth.logout":
                response.headers["Clear-Site-Data"] = '"cache", "cookies", "storage"'

            return response

    def _build_csp(self, policy):
        """Build the Content Security Policy header value."""
        parts = []
        for directive, sources in policy.items():
            if sources:
                parts.append(f"{directive} {' '.join(sources)}")
        return "; ".join(parts)

    def _build_permissions_policy(self, policy):
        """Build the Permissions Policy header value."""
        parts = []
        for feature, allowlist in policy.items():
            if allowlist:
                parts.append(f"{feature}=({' '.join(allowlist)})")
        return ", ".join(parts)


def require_https():
    """Decorator to require HTTPS for specific routes."""

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not request.is_secure and not current_app.debug:
                return make_response(
                    (
                        {"error": "HTTPS required"},
                        403,
                        {"Content-Type": "application/json"},
                    )
                )
            return f(*args, **kwargs)

        return wrapped

    return decorator


security = SecurityHeaders()
