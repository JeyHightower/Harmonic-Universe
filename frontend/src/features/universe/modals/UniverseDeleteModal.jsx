import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../../components/common/Button';
import { deleteUniverse } from '../../../store/thunks/universeThunks';
import '../styles/UniverseFormModal.css';

/**
 * Universe Delete Modal component
 */
const UniverseDeleteModal = ({ isOpen, onClose, onSuccess, universe }) => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!universe || !universe.id) {
      setError('Invalid universe data');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('UniverseDeleteModal - Deleting universe:', universe.id);
      // Execute the delete operation and wait for it to complete
      const result = await dispatch(deleteUniverse(universe.id)).unwrap();
      console.log('UniverseDeleteModal - Universe deleted successfully:', result);

      // Call onSuccess callback with the deleted universe ID first
      // This ensures parent components update their state before modal closes
      if (onSuccess) {
        onSuccess(universe.id);
      }

      // Then close the modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('UniverseDeleteModal - Failed to delete universe:', err);
      setError(err.message || 'Failed to delete universe. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className="universe-delete-modal"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      disablePortal={false}
      keepMounted={false}
      style={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      }}
      PaperProps={{
        className: 'universe-delete-modal-paper',
        elevation: 24,
      }}
    >
      <DialogTitle id="delete-dialog-title" className="universe-delete-modal-title">
        Delete Universe
      </DialogTitle>
      <DialogContent className="universe-delete-modal-content">
        <div className="delete-confirmation" id="delete-dialog-description">
          <p className="delete-message">
            Are you sure you want to delete the universe &quot;{universe?.name}&quot;?
          </p>
          <p className="delete-warning">
            This action cannot be undone and will delete all scenes, characters, and notes
            associated with this universe.
          </p>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions className="universe-delete-modal-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isDeleting}
          className="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={isDeleting}
          className="delete-button"
        >
          {isDeleting ? 'Deleting...' : 'Delete Universe'}
        </Button>
      </DialogActions>
    </Dialog>
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
