import React from "react";
import styles from "./VersionHistory.module.css";

const VersionHistory = ({ versions, currentVersion, onRestore }) => {
  if (!versions || versions.length === 0) {
    return null;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChangeSummary = (version) => {
    const wordCount = version.content.split(/\s+/).length;
    const charCount = version.content.length;
    return `${wordCount} words, ${charCount} characters`;
  };

  return (
    <div className={styles.versionHistory}>
      <h4>Version History</h4>
      <div className={styles.versions}>
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`${styles.version} ${
              version.id === currentVersion ? styles.current : ""
            }`}
          >
            <div className={styles.versionHeader}>
              <div className={styles.versionInfo}>
                <span className={styles.versionNumber}>
                  v{versions.length - index}
                </span>
                <span className={styles.versionDate}>
                  {formatDate(version.createdAt)}
                </span>
              </div>
              {version.id !== currentVersion && (
                <button
                  onClick={() => onRestore(version.id)}
                  className={styles.restoreButton}
                >
                  Restore
                </button>
              )}
            </div>
            <div className={styles.changes}>
              <div className={styles.change}>
                <i className="fas fa-info-circle"></i>
                {getChangeSummary(version)}
              </div>
              {version.description && (
                <div className={styles.changeDescription}>
                  {version.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;
