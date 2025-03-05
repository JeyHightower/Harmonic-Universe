#!/usr/bin/env python3
import json
from backend.app.db.session import get_db
from backend.app.models.universe import Universe

def main():
    with get_db() as db:
        universe = db.query(Universe).first()
        if universe:
            print('Universe ID:', universe.id)
            print('Harmony Params:', universe.harmony_params)
            print('Physics Params:', universe.physics_params)
        else:
            print('No universe found')

if __name__ == "__main__":
    main()
