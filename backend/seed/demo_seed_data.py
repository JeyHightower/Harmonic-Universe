from models import User, Universe, Character, Location, AlignmentType
from config import db

def demo_seed_data():
    demo_user = User(
        is_admin = False,
        name = 'demo_user',
        username = 'demo',
        email = 'demo@email.com',
        password = 'demo123'
    )

    demo_universe_1 = Universe(
        name= 'demo_universe_1',
        creator= demo_user,
        description= 'This is an example of a demo Universe for demo use.',
        alignment= AlignmentType.NEUTRAL
    )

    demo_universe_2 = Universe(
        name= 'demo_universe_2',
        creator= demo_user,
        description= 'This is the 2nd example of a demo Universe for demo use.',
        alignment= AlignmentType.GOOD
    )

    demo_character_1 = Character(
        name= 'character 1',
        age= 20,
        creator= demo_user,
        origin= 'unknown',
        main_power_set= 'paper manipulation',
        secondary_power_set= 'nature manipulation',
        skills = ['Master Strategist']

    )

    demo_location = Location(
        name= 'Location 1',
        location_type= 'city',
        description= 'Demo Location for demo user.',
        creator=  demo_user

    )

    demo_character_1.universes.append(demo_universe_1)
    demo_universe_1.locations.append(demo_location)

    try: 
        db.session.add_all([demo_user, demo_universe_1, demo_universe_2, demo_character_1, demo_location])
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Sedding failed: {e}")







