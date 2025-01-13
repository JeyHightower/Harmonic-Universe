from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect
from flask_session import Session

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
csrf = CSRFProtect()
session = Session()
