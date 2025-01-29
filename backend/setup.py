from setuptools import setup, find_packages

setup(
    name="harmonic-universe-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        'flask',
        'flask-sqlalchemy',
        'flask-migrate',
        'flask-login',
        'flask-cors',
        'flask-jwt-extended',
        'python-dotenv',
        'pytest',
        'pytest-cov',
    ],
    python_requires='>=3.9',
)
