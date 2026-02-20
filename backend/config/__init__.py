import os
from dotenv import load_dotenv
from datetime import timedelta
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import  SQLAlchemy

load_dotenv()
db = SQLAlchemy()
jwt = JWTManager()

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///harmonic.db'
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'default-secret'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'super-secret-jwt-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours = 1)
