from sqlalchemy import inspect
from app import create_app
from app.db.session import init_engine

app = create_app()
with app.app_context():
    engine = init_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    inspector = inspect(engine)

    print("\nDatabase Tables:")
    print("-" * 50)
    for table_name in inspector.get_table_names():
        print(f"- {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"  • {column['name']}: {column['type']}")
        print()
