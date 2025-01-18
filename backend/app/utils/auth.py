def check_universe_access(universe, user_id, require_ownership=False):
    """
    Check if a user has access to a universe.

    Args:
        universe: The Universe model instance to check
        user_id: The ID of the user requesting access
        require_ownership: If True, only the creator can access

    Returns:
        bool: True if user has access, False otherwise
    """
    if not universe:
        return False

    # Public universes are accessible to all users unless ownership is required
    if not universe.is_private and not require_ownership:
        return True

    # For private universes or when ownership is required, check creator
    return universe.creator_id == user_id
