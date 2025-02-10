import random
import string
from datetime import datetime, timedelta
from app.models import db

def random_string(length=10):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def random_email():
    """Generate a random email address"""
    return f"{random_string()}@example.com"

def create_test_data(model_class, **kwargs):
    """Create and return a test instance of the given model"""
    instance = model_class(**kwargs)
    db.session.add(instance)
    db.session.commit()
    return instance

def clear_data(model_class):
    """Clear all data for the given model"""
    model_class.query.delete()
    db.session.commit()

def assert_dates_equal(date1, date2):
    """Assert that two dates are equal, ignoring milliseconds"""
    if isinstance(date1, str):
        date1 = datetime.fromisoformat(date1.replace('Z', '+00:00'))
    if isinstance(date2, str):
        date2 = datetime.fromisoformat(date2.replace('Z', '+00:00'))
    assert abs(date1 - date2) < timedelta(seconds=1)

def assert_model_equal(model1, model2, exclude_fields=None):
    """Assert that two model instances are equal"""
    exclude_fields = exclude_fields or []
    exclude_fields.extend(['_sa_instance_state', 'created_at', 'updated_at'])

    dict1 = {k: v for k, v in model1.__dict__.items() if k not in exclude_fields}
    dict2 = {k: v for k, v in model2.__dict__.items() if k not in exclude_fields}
    assert dict1 == dict2
