#!/usr/bin/env python3
"""
Script to verify Python imports and diagnose issues
Run this on Render.com to help debug import problems
"""
import sys
import os
import importlib

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 50)
    print(f" {title}")
    print("=" * 50)

print_section("PYTHON PATH")
for path in sys.path:
    print(f"- {path}")

print_section("ENVIRONMENT VARIABLES")
for key, value in os.environ.items():
    if 'PATH' in key or key in ['FLASK_APP', 'PYTHONPATH']:
        print(f"{key}: {value}")

print_section("DIRECTORY STRUCTURE")
print("Current directory:", os.getcwd())
print("\nContents of current directory:")
for item in os.listdir('.'):
    if os.path.isdir(item):
        print(f"- DIR: {item}/")
    else:
        print(f"- FILE: {item}")

if os.path.exists('app'):
    print("\nContents of app/ directory:")
    for item in os.listdir('app'):
        if os.path.isdir(os.path.join('app', item)):
            print(f"- DIR: {item}/")
        else:
            print(f"- FILE: {item}")

if os.path.exists('backend'):
    print("\nContents of backend/ directory:")
    for item in os.listdir('backend'):
        if os.path.isdir(os.path.join('backend', item)):
            print(f"- DIR: {item}/")
        else:
            print(f"- FILE: {item}")

print_section("IMPORT TESTS")

modules_to_test = [
    'app',
    'backend.app',
    'app.core.config',
    'backend.app.core.config',
]

for module_name in modules_to_test:
    try:
        module = importlib.import_module(module_name)
        print(f"✅ Successfully imported {module_name}")
        if module_name in ['app', 'backend.app']:
            if hasattr(module, 'create_app'):
                print(f"  ✅ {module_name} has create_app function")
            else:
                print(f"  ❌ {module_name} does NOT have create_app function")
    except ImportError as e:
        print(f"❌ Failed to import {module_name}: {e}")

print_section("END OF REPORT")
