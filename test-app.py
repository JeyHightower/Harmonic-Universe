#!/usr/bin/env python3
from app import create_app

print("Testing application imports...")
app = create_app()
print(f"✅ Application loaded successfully")
print(f"Application routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
