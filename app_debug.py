from app import create_app
import os
from port import get_port

app = create_app()

if __name__ == '__main__':
    port = get_port()
    print(f"Routes registered:")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.rule}")
    app.run(host='0.0.0.0', port=port, debug=True)
