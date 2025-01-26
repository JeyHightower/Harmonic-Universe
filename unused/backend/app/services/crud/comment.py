"""Comment CRUD service module."""
from typing import List, Optional
from app.models import Comment
from app.services.crud.base import CRUDBase


class CRUDComment(CRUDBase):
    """CRUD operations for Comment model."""

    def __init__(self):
        super().__init__(Comment)

    def create_comment(
        self,
        universe_id: int,
        user_id: int,
        content: str,
        parent_id: Optional[int] = None,
    ) -> Optional[Comment]:
        """Create a new comment."""
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
        return self.model.query.filter_by(**filters).all()

    def get_user_comments(self, user_id: int) -> List[Comment]:
        """Get all comments by a user."""
        return self.model.query.filter_by(user_id=user_id).all()

    def update_if_owner(
        self, comment_id: int, user_id: int, content: str
    ) -> Optional[Comment]:
        """Update a comment if user is the owner."""
        comment = self.get(comment_id)
        if not comment or comment.user_id != user_id:
            return None
        return self.update(comment_id, {"content": content, "is_edited": True})

    def delete_if_owner(self, comment_id: int, user_id: int) -> bool:
        """Delete a comment if user is the owner."""
        comment = self.get(comment_id)
        if not comment or comment.user_id != user_id:
            return False
        return self.delete(comment_id)

    def get_replies(self, comment_id: int) -> List[Comment]:
        """Get all replies to a comment."""
        return self.model.query.filter_by(parent_id=comment_id).all()

    def get_thread(self, comment_id: int) -> List[Comment]:
        """Get a comment and all its replies."""
        comment = self.get(comment_id)
        if not comment:
            return []

        thread = [comment]
        replies = self.get_replies(comment_id)
        thread.extend(replies)
        return thread


comment_crud = CRUDComment()
