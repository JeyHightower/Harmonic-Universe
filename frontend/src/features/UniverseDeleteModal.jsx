import PropTypes from "prop-types";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { deleteUniverse } from "../store/universeThunks";

const UniverseDeleteModal = ({ isOpen, onClose, onSuccess, universe }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.universes);
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

      // Log more details about what we're deleting
      console.log("UniverseDeleteModal - Universe details:", {
        id: universe.id,
        name: universe.name,
        scenes_count: universe.scenes_count || "unknown",
        characters_count: universe.characters_count || "unknown",
        notes_count: universe.notes_count || "unknown",
      });

      const result = await dispatch(deleteUniverse(universe.id)).unwrap();
      console.log(
        "UniverseDeleteModal - Universe deleted successfully:",
        result
      );

      if (onSuccess) {
        onSuccess(universe.id);
      }
    } catch (err) {
      console.error("UniverseDeleteModal - Failed to delete universe:", err);

      // Provide more detailed error information
      const errorMessage =
        err.data?.message ||
        err.message ||
        "Failed to delete universe. Please try again.";
      console.error("UniverseDeleteModal - Error details:", {
        message: errorMessage,
        statusCode: err.status,
        data: err.data,
      });

      setError(errorMessage);

      // If the error is a 404, the universe might already be deleted
      if (err.status === 404) {
        console.log(
          "UniverseDeleteModal - Universe not found, considering it deleted"
        );
        if (onSuccess) {
          onSuccess(universe.id);
        }
      }
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

        {universe?.scenes_count > 0 && (
          <p className="delete-details">
            This universe contains {universe.scenes_count} scenes,
            {universe.characters_count} characters, and {universe.notes_count}{" "}
            notes that will be permanently deleted.
          </p>
        )}

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
            disabled={isDeleting || loading}
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
    name: PropTypes.string.isRequired,
    scenes_count: PropTypes.number,
    characters_count: PropTypes.number,
    notes_count: PropTypes.number,
  }).isRequired,
};

export default UniverseDeleteModal;
