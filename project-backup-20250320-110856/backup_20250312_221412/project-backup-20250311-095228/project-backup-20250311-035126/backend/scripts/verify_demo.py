"""Script to verify demo user, universe, and scene."""
from backend.app.db.session import get_db
from backend.app.models.core.user import User
from backend.app.models.core.universe import Universe
from backend.app.models.core.scene import Scene


def verify_demo_data():
    """Verify demo user, universe, and scene exist in the database."""
    with get_db() as db:
        # Check demo user
        demo_user = db.query(User).filter_by(email="demo@example.com").first()
        if demo_user:
            print(
                f"\nDemo User:\n  ID: {demo_user.id}\n  Username: {demo_user.username}\n  Email: {demo_user.email}\n  Active: {demo_user.is_active}\n  Color: {demo_user.color}"
            )

            # Check demo universe
            demo_universe = db.query(Universe).filter_by(user_id=demo_user.id).first()
            if demo_universe:
                print(
                    f"\nDemo Universe:\n  ID: {demo_universe.id}\n  Name: {demo_universe.name}\n  Description: {demo_universe.description}\n  Public: {demo_universe.is_public}\n  Physics Params: {demo_universe.physics_params}\n  Harmony Params: {demo_universe.harmony_params}"
                )

                # Check demo scene
                demo_scene = (
                    db.query(Scene).filter_by(universe_id=demo_universe.id).first()
                )
                if demo_scene:
                    print(
                        f"\nDemo Scene:\n  ID: {demo_scene.id}\n  Name: {demo_scene.name}\n  Description: {demo_scene.description}"
                    )
                else:
                    print("\nNo demo scene found")
            else:
                print("\nNo demo universe found")
        else:
            print("\nNo demo user found")


if __name__ == "__main__":
    verify_demo_data()
