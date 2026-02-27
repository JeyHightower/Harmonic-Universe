import enum
from sqlalchemy import Enum

class AlignmentType(enum.Enum):
    GOOD = 'good'
    BAD = 'bad'
    NEUTRAL = 'neutral'
    CHAOTIC  = 'chaotic'
    LAWFUL = 'lawful'

class LocationType(enum.Enum):
    GALAXY = 'Galaxy'
    SYSTEM = 'System'
    PLANET = 'Planet'

    CONTINENT = 'Continent'
    KINGDOM = 'Kingdom'
    STATE = 'State'

    CITY = 'City'
    TOWN = 'Town'
    VILLAGE = 'Village'

    STREET = 'Street'
    BUILDING = 'Building'
    ROOM = 'Room'
    LANDMARK = 'Landmark'

    @property
    def grouping(self):
        if self in {self.GALAXY, self.SYSTEM, self.PLANET}:
            return 'Cosmic'
        if self in {self.CONTINENT, self.KINGDOM, self.STATE}:
            return 'Regional'
        if self in {self.CITY, self.TOWN, self.VILLAGE}:
            return 'Settlement'
        return 'Granular'