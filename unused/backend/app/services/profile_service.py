from typing import Dict, Optional
from app.models import Profile
from app.services.base import BaseService


class ProfileService(BaseService):
    """Service class for Profile model operations."""

    def __init__(self):
        super().__init__(Profile)

    def create_profile(self, user_id: int, data: Dict) -> Optional[Profile]:
        """Create a new profile."""
        if self.exists(user_id=user_id):
            raise ValueError("Profile already exists for this user")

        data["user_id"] = user_id
        return self.create(data)

    def get_user_profile(self, user_id: int) -> Optional[Profile]:
        """Get profile for a user."""
        return self.get_one_by_filter(user_id=user_id)

    def update_profile(self, user_id: int, data: Dict) -> Optional[Profile]:
        """Update user profile."""
        profile = self.get_one_by_filter(user_id=user_id)
        if not profile:
            return None

        return self.update(profile.id, data)

    def delete_profile(self, user_id: int) -> bool:
        """Delete user profile."""
        profile = self.get_one_by_filter(user_id=user_id)
        if not profile:
            return False

        return self.delete(profile.id)

    def update_avatar(self, user_id: int, avatar_url: str) -> Optional[Profile]:
        """Update profile avatar."""
        profile = self.get_one_by_filter(user_id=user_id)
        if not profile:
            return None

        return self.update(profile.id, {"avatar_url": avatar_url})

    def update_social_links(
        self, user_id: int, social_links: Dict
    ) -> Optional[Profile]:
        """Update profile social links."""
        profile = self.get_one_by_filter(user_id=user_id)
        if not profile:
            return None

        return self.update(profile.id, {"social_links": social_links})
