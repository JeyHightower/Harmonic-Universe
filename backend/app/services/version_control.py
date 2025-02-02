from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models import db, Scene, SceneVersion, User
from ..exceptions import VersionNotFoundError

class VersionControl:
    def create_snapshot(self, scene_id: int, user_id: int, message: str = "") -> Optional[SceneVersion]:
        """Create a snapshot of the current scene state"""
        scene = Scene.query.get(scene_id)
        if not scene:
            return None

        # Create version record
        version = SceneVersion(
            scene_id=scene_id,
            user_id=user_id,
            state=scene.to_dict(),
            message=message,
            created_at=datetime.utcnow()
        )

        db.session.add(version)
        db.session.commit()

        return version

    def restore_version(self, scene_id: int, version_id: int) -> Optional[Scene]:
        """Restore scene to a specific version"""
        scene = Scene.query.get(scene_id)
        version = SceneVersion.query.get(version_id)

        if not scene or not version:
            raise VersionNotFoundError("Scene or version not found")

        # Create snapshot of current state before restoring
        self.create_snapshot(
            scene_id=scene_id,
            user_id=version.user_id,
            message="Auto-snapshot before version restore"
        )

        # Restore state
        scene.update_from_dict(version.state)
        db.session.commit()

        return scene

    def get_history(self, scene_id: int, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get version history for a scene"""
        versions = SceneVersion.query.filter_by(scene_id=scene_id)\
            .order_by(SceneVersion.created_at.desc())\
            .offset(offset)\
            .limit(limit)\
            .all()

        return [
            {
                'id': v.id,
                'user_id': v.user_id,
                'message': v.message,
                'created_at': v.created_at.isoformat(),
                'changes': self._compute_changes(v)
            }
            for v in versions
        ]

    def compare_versions(self, version_id1: int, version_id2: int) -> Dict[str, Any]:
        """Compare two versions of a scene"""
        v1 = SceneVersion.query.get(version_id1)
        v2 = SceneVersion.query.get(version_id2)

        if not v1 or not v2:
            raise VersionNotFoundError("One or both versions not found")

        return {
            'added': self._get_added_elements(v1.state, v2.state),
            'removed': self._get_removed_elements(v1.state, v2.state),
            'modified': self._get_modified_elements(v1.state, v2.state)
        }

    def _compute_changes(self, version: SceneVersion) -> Dict[str, Any]:
        """Compute changes made in this version"""
        previous = SceneVersion.query\
            .filter(SceneVersion.scene_id == version.scene_id,
                   SceneVersion.created_at < version.created_at)\
            .order_by(SceneVersion.created_at.desc())\
            .first()

        if not previous:
            return {
                'type': 'initial',
                'details': 'Initial version'
            }

        return {
            'type': 'update',
            'added': self._get_added_elements(previous.state, version.state),
            'removed': self._get_removed_elements(previous.state, version.state),
            'modified': self._get_modified_elements(previous.state, version.state)
        }

    def _get_added_elements(self, old_state: Dict, new_state: Dict) -> List[str]:
        """Get elements added in new version"""
        return list(set(new_state.keys()) - set(old_state.keys()))

    def _get_removed_elements(self, old_state: Dict, new_state: Dict) -> List[str]:
        """Get elements removed in new version"""
        return list(set(old_state.keys()) - set(new_state.keys()))

    def _get_modified_elements(self, old_state: Dict, new_state: Dict) -> List[str]:
        """Get elements modified in new version"""
        common_keys = set(old_state.keys()) & set(new_state.keys())
        return [k for k in common_keys if old_state[k] != new_state[k]]
