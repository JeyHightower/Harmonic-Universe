from typing import List, Optional
from app.models import Comment
from app.services.base import BaseService


class CommentService(BaseService):
    """Service class for Comment model operations."""

    def __init__(self):
        super().__init__(Comment)

    def add_comment(
        self,
        universe_id: int,
        user_id: int,
        content: str,
        parent_id: Optional[int] = None,
    ) -> Optional[Comment]:
        """Add a new comment."""
        data = {
            "universe_id": universe_id,
            "user_id": user_id,
            "content": content,
            "parent_id": parent_id,
        }
        return self.create(data)

    def get_universe_comments(
        self, universe_id: int, parent_id: Optional[int] = None
    ) -> List[Comment]:
        """Get comments for a universe."""
        filters = {"universe_id": universe_id}
        if parent_id is not None:
            filters["parent_id"] = parent_id
        return self.get_by_filter(**filters)

    def get_user_comments(self, user_id: int) -> List[Comment]:
        """Get all comments by a user."""
        return self.get_by_filter(user_id=user_id)

    def update_comment(
        self, comment_id: int, user_id: int, content: str
    ) -> Optional[Comment]:
        """Update a comment if user is the author."""
        comment = self.get_by_id(comment_id)
        if not comment or comment.user_id != user_id:
            return None

        return self.update(comment_id, {"content": content, "is_edited": True})

    def delete_comment(self, comment_id: int, user_id: int) -> bool:
        """Delete a comment if user is the author."""
        comment = self.get_by_id(comment_id)
        if not comment or comment.user_id != user_id:
            return False

        return self.delete(comment_id)

    def get_comment_thread(self, comment_id: int) -> List[Comment]:
        """Get a comment and all its replies."""
        comment = self.get_by_id(comment_id)
        if not comment:
            return []

        thread = [comment]
        replies = self.get_by_filter(parent_id=comment_id)
        thread.extend(replies)
        return thread
