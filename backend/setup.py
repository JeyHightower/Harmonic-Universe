from setuptools import setup, find_packages

setup(
    name="harmonic-universe",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'Flask==2.2.5',
        'Flask-SQLAlchemy==3.0.4',
        'Flask-Migrate==4.0.4',
        'Flask-WTF==1.2.1',
        'Flask-Cors==4.0.0',
        'Flask-Session==0.5.0',
        'Flask-JWT-Extended==4.5.3',
        'python-dotenv==1.0.0',
        'bcrypt==4.0.1',
        'Werkzeug==2.2.3',
        'SQLAlchemy==1.4.41',
        'PyJWT==2.9.0',
        'pytest==7.4.3',
        'pytest-flask==1.3.0',
        'coverage==7.4.0',
        'redis==5.0.1'
    ],
)
