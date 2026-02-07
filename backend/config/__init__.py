import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///harmonic.db'
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default-secret'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
