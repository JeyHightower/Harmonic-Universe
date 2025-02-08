from app import create_app, socketio
from app.core.middleware import setup_middleware
from config import config

app = create_app(config['development'])
app = setup_middleware(app)

if __name__ == '__main__':
    socketio.run(app, debug=app.config['DEBUG'], host='0.0.0.0', port=5000)
