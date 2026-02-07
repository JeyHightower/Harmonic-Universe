import enum
from sqlalchemy import Enum

class AlignmentType(enum.Enum):
    GOOD = 'good'
    BAD = 'bad'
    NEUTRAL = 'neutral'