import logging
from sqlalchemy import create_engine, text
from app.core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log configuration
logger.info("Database Configuration:")
logger.info(f"POSTGRES_SERVER: {settings.POSTGRES_SERVER}")
logger.info(f"POSTGRES_USER: {settings.POSTGRES_USER}")
logger.info(f"POSTGRES_DB: {settings.POSTGRES_DB}")
logger.info(f"POSTGRES_PORT: {settings.POSTGRES_PORT}")
logger.info(f"SQLALCHEMY_DATABASE_URI: {settings.SQLALCHEMY_DATABASE_URI}")

# Create database URL
db_url = str(settings.SQLALCHEMY_DATABASE_URI)
logger.info(f"\nAttempting to connect with: {db_url}")

# Create engine
engine = create_engine(db_url)

try:
    # Test connection with explicit query
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        logger.info("✅ Successfully connected to the database!")
except Exception as e:
    logger.error(f"❌ Database connection failed: {str(e)}")
    raise
