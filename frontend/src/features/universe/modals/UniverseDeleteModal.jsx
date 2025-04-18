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
      await dispatch(deleteUniverse(universe.id)).unwrap();
      console.log('UniverseDeleteModal - Universe deleted successfully');

      if (onSuccess) {
        onSuccess(universe.id);
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
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{'Delete Universe'}</DialogTitle>
      <DialogContent>
        <div className="delete-confirmation">
          <p className="delete-message">
            Are you sure you want to delete the universe &quot;{universe?.name}&quot;?
          </p>
          <p className="delete-warning">
            This action cannot be undone and will delete all scenes, characters, and notes
            associated with this universe.
          </p>

          {error && <div className="error-message">{error}</div>}
        </div>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={handleDelete} disabled={isDeleting}>
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
