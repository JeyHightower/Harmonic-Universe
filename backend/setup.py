from setuptools import setup, find_packages

setup(
    name="harmonic-universe",
    version="0.1.0",
    packages=find_packages(include=['app*', 'tests*']),
    include_package_data=True,
    install_requires=[
        "flask",
        "flask-sqlalchemy",
        "flask-migrate",
        "flask-cors",
        "flask-jwt-extended",
        "flask-socketio",
        "eventlet",
        "pydantic",
        "pydantic-settings",
        "python-dotenv",
        "pytest",
        "pytest-cov",
        "pytest-asyncio",
        "pytest-mock",
    ],
)
