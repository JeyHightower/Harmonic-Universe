from sqlalchemy import create_engine, inspect
from backend.app.core.config import settings

def check_tables():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print('\nTables in database:')
    for table in sorted(tables):
        print(f'- {table}')

if __name__ == '__main__':
    check_tables()
