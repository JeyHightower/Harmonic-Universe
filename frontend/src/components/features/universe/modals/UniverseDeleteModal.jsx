import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "../../../../common";
import Modal from "../../../../common/Modal";
import { deleteUniverse } from "../../../../store/thunks/universeThunks";

/**
 * Universe Delete Modal component
 */
const UniverseDeleteModal = ({ isOpen, onClose, onSuccess, universe }) => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!universe || !universe.id) {
      setError("Invalid universe data");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log("UniverseDeleteModal - Deleting universe:", universe.id);
      await dispatch(deleteUniverse(universe.id)).unwrap();
      console.log("UniverseDeleteModal - Universe deleted successfully");

      if (onSuccess) {
        onSuccess(universe.id);
      }
    } catch (err) {
      console.error(
        "UniverseDeleteModal - Failed to delete universe:",
        err
      );
      setError(err.message || "Failed to delete universe. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Universe"
      className="universe-delete-modal"
    >
      <div className="delete-confirmation">
        <p className="delete-message">
          Are you sure you want to delete the universe "{universe?.name}"?
        </p>
        <p className="delete-warning">
          This action cannot be undone and will delete all scenes, characters,
          and notes associated with this universe.
        </p>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Universe"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

UniverseDeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universe: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
  }).isRequired,
};

export default UniverseDeleteModal; 