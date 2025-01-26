from setuptools import setup, find_packages

setup(
    name="harmonic-universe-backend",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "flask",
        "flask-sqlalchemy",
        "flask-migrate",
        "flask-jwt-extended",
        "flask-cors",
        "flask-socketio",
        "pytest",
        "pytest-cov",
        "pytest-env",
        "python-dotenv",
    ],
    extras_require={
        "test": [
            "pytest",
            "pytest-cov",
            "pytest-env",
        ],
    },
)
