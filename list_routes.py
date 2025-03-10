#!/usr/bin/env python
import os
import sys
from app import create_app

app = create_app()

print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule.rule}")
