"""JWT token management utilities."""
from flask_jwt_extended import get_jwt
from datetime import datetime
import logging

# Initialize the blocklist as a simple set
# NOTE: This is an in-memory solution and will be cleared on server restart
# For production, use Redis or a database table
JWT_BLOCKLIST = set()

logger = logging.getLogger(__name__)


def add_token_to_blocklist(token):
    """Add a token to the blocklist.

    Args:
        token: The JWT token data
    """
    jti = token.get("jti")
    if jti:
        JWT_BLOCKLIST.add(jti)
        logger.info(f"Token with JTI {jti} has been added to the blocklist")
    else:
        logger.warning("Attempted to blocklist a token without a JTI")


def is_token_in_blocklist(jwt_header, jwt_payload):
    """Check if a token is in the blocklist.

    Args:
        jwt_header: The JWT header
        jwt_payload: The JWT payload containing the JTI

    Returns:
        bool: True if the token is in the blocklist, False otherwise
    """
    jti = jwt_payload.get("jti")
    if jti in JWT_BLOCKLIST:
        logger.info(f"Blocked token with JTI {jti} was used in a request")
        return True
    return False
