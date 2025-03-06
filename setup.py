from setuptools import setup, find_packages

setup(
    name="harmonic-universe",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "sqlalchemy==1.4.41",
        "fastapi==0.95.0",
        "uvicorn==0.21.1",
        "pydantic==1.10.7",
        "python-jose==3.3.0",
        "passlib==1.7.4",
        "python-multipart==0.0.6",
        "psycopg2-binary==2.9.1",
        "python-dotenv==0.21.1",
        "alembic==1.10.2",
        "Flask-CORS==3.0.10",
        "gunicorn==20.1.0",
    ],
)
