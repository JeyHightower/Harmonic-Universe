# app/config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///harmonic_universe.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
