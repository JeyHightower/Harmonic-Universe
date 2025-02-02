from sqlalchemy import create_engine, Column, Integer, String, MetaData, Table

# Create an in-memory SQLite database
engine = create_engine('sqlite:///:memory:')
metadata = MetaData()

# Define a simple table
users = Table('users', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String)
)

# Create the table
metadata.create_all(engine)

# Insert a record
with engine.connect() as connection:
    connection.execute(users.insert().values(name='Test User'))

# Query the table
with engine.connect() as connection:
    result = connection.execute(users.select())
    for row in result:
        print(row)
