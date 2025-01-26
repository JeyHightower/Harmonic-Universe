import PropTypes from "prop-types";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUniversePrivacy } from "../../store/slices/universeSlice";
import styles from "./Universe.module.css";

const PrivacyToggle = ({ universeId, isPublic }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.universe);
  const currentUser = useSelector((state) => state.auth.user);
  const universe = useSelector((state) => state.universe.currentUniverse);

  // Only show toggle if user is the creator
  if (!universe || universe.creator_id !== currentUser?.id) {
    return null;
  }

  const handleToggle = async () => {
    try {
      await dispatch(
        updateUniversePrivacy({
          universeId,
          isPublic: !isPublic,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to update privacy:", error);
    }
  };

  return (
    <div className={styles.privacyToggle}>
      <label className={styles.toggleLabel}>
        <span className={styles.toggleText}>
          {isPublic ? "Public" : "Private"}
        </span>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`${styles.toggleButton} ${
            isPublic ? styles.public : styles.private
          }`}
          title={isPublic ? "Make Private" : "Make Public"}
        >
          <div className={styles.toggleSlider}>
            <span className={styles.toggleIcon}>{isPublic ? "🌍" : "🔒"}</span>
          </div>
        </button>
      </label>
      {isLoading && (
        <span className={styles.loadingIndicator}>Updating...</span>
      )}
    </div>
  );
};

PrivacyToggle.propTypes = {
  universeId: PropTypes.string.isRequired,
  isPublic: PropTypes.bool.isRequired,
};

export default PrivacyToggle;
