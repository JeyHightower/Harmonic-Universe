#!/usr/bin/env python
from wsgi_app import application
from port import get_port

if __name__ == '__main__':
    port = get_port()
    application.run(host='0.0.0.0', port=port, debug=True)
