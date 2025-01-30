from ..extensions import socketio

def init_socketio(app):
    # Import socket event handlers
    from . import events  # noqa

    return socketio

