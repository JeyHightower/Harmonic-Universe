from flask_marshmallow import Marshmallow
from flask_marshmallow.fields import fields
from .extensions import db
from .models.physics_object import PhysicsObject
from .models.physics_constraint import PhysicsConstraint

ma = Marshmallow()


class PhysicsObjectSchema(ma.SQLAlchemyAutoSchema):
    """Schema for PhysicsObject model."""
    class Meta:
        model = PhysicsObject
        include_fk = True
        load_instance = True
        sqla_session = db.session

    # Complex fields that need custom serialization
    position = fields.Dict()
    velocity = fields.Dict()
    acceleration = fields.Dict()
    dimensions = fields.Dict()
    collision_filter = fields.Dict()


class PhysicsConstraintSchema(ma.SQLAlchemyAutoSchema):
    """Schema for PhysicsConstraint model."""
    class Meta:
        model = PhysicsConstraint
        include_fk = True
        load_instance = True
        sqla_session = db.session

    # Complex fields that need custom serialization
    parameters = fields.Dict()
    anchor_a = fields.Dict()
    anchor_b = fields.Dict()
