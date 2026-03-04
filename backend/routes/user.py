from flask import Blueprint, jsonify, request
from flask_jwt_extened import jwt_required
from models import User
from config import db
from utils import get_current_user

user_bp = Blueprint('users', __name__, url_prefix='/users')


@user_bp.route('/', methods=['GET'])
@jwt_required()