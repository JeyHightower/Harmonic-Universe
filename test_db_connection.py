from sqlalchemy import create_engine
import os

# Construct the database URL
DATABASE_URL = f"postgresql+psycopg2://{os.environ['DB_USER']}:{os.environ['DB_PASSWORD']}@localhost/{os.environ['DB_NAME']}"

# Create an engine
engine = create_engine(DATABASE_URL)

try:
    # Attempt to connect to the database
    with engine.connect() as connection:
        print("Connection to the database was successful!")
except Exception as e:
    print(f"Failed to connect to the database: {e}")
