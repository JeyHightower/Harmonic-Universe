import React, { useEffect, useRef } from "react";
import styles from "./CollaborationOverlay.module.css";

const CollaboratorCursor = ({ position, username, color }) => (
  <div
    className={styles.cursor}
    style={{
      left: position.x,
      top: position.y,
      backgroundColor: color,
    }}
  >
    <div className={styles.cursorPoint} />
    <span className={styles.cursorLabel}>{username}</span>
  </div>
);

const CollaboratorsList = ({ collaborators }) => (
  <div className={styles.collaboratorsList}>
    <h4>Collaborators</h4>
    <div className={styles.collaboratorsGrid}>
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className={styles.collaborator}
          style={{ borderColor: collaborator.color }}
        >
          <div
            className={styles.collaboratorDot}
            style={{ backgroundColor: collaborator.color }}
          />
          <span>{collaborator.username}</span>
        </div>
      ))}
    </div>
  </div>
);

const CollaborationOverlay = ({
  collaborators,
  cursorPositions,
  isCollaborating,
  onStartCollaboration,
  onStopCollaboration,
}) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!overlayRef.current) return;

    const updateCursorPositions = () => {
      const rect = overlayRef.current.getBoundingClientRect();
      // Update relative positions based on overlay bounds
      Object.values(cursorPositions).forEach((cursor) => {
        cursor.position.x = Math.max(
          0,
          Math.min(cursor.position.x - rect.left, rect.width),
        );
        cursor.position.y = Math.max(
          0,
          Math.min(cursor.position.y - rect.top, rect.height),
        );
      });
    };

    window.addEventListener("resize", updateCursorPositions);
    updateCursorPositions();

    return () => {
      window.removeEventListener("resize", updateCursorPositions);
    };
  }, [cursorPositions]);

  return (
    <div className={styles.overlay} ref={overlayRef}>
      <div className={styles.header}>
        <div className={styles.status}>
          {isCollaborating ? (
            <span className={styles.collaborating}>
              Collaborating ({collaborators.length} active)
            </span>
          ) : (
            <span className={styles.notCollaborating}>Not collaborating</span>
          )}
        </div>
        <button
          className={`${styles.button} ${
            isCollaborating ? styles.stopButton : styles.startButton
          }`}
          onClick={isCollaborating ? onStopCollaboration : onStartCollaboration}
        >
          {isCollaborating ? "Stop Collaboration" : "Start Collaboration"}
        </button>
      </div>

      {isCollaborating && (
        <>
          <CollaboratorsList collaborators={collaborators} />
          {Object.entries(cursorPositions).map(([userId, cursor]) => {
            const collaborator = collaborators.find((c) => c.id === userId);
            if (!collaborator) return null;

            return (
              <CollaboratorCursor
                key={userId}
                position={cursor.position}
                username={collaborator.username}
                color={collaborator.color}
              />
            );
          })}
        </>
      )}
    </div>
  );
};

export default React.memo(CollaborationOverlay);
