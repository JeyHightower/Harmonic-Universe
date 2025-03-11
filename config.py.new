from dotenv import load_dotenv
load_dotenv()
import os

# Configuration settings
class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-for-harmonic-universe")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
