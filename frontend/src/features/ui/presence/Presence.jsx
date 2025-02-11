import React from "react";
import { useCollaboration } from "../../contexts/CollaborationContext";
import styles from "./Presence.module.css";

const Presence = () => {
  const { onlineUsers, activeEditors } = useCollaboration();

  return (
    <div className={styles.presence}>
      <div className={styles.onlineUsers}>
        <h4>Online Users</h4>
        <div className={styles.userList}>
          {onlineUsers.map((user) => (
            <div key={user.id} className={styles.user}>
              <div className={styles.userAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.onlineIndicator} />
            </div>
          ))}
        </div>
      </div>
      {Object.keys(activeEditors).length > 0 && (
        <div className={styles.activeEditors}>
          <h4>Currently Editing</h4>
          <div className={styles.editorList}>
            {Object.entries(activeEditors).map(([storyboardId, users]) => (
              <div key={storyboardId} className={styles.editorGroup}>
                <span className={styles.storyboardTitle}>
                  Plot Point #{storyboardId}
                </span>
                <div className={styles.editors}>
                  {users.map((user) => (
                    <div key={user.id} className={styles.editor}>
                      <div className={styles.editorAvatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.editorName}>{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Presence;
