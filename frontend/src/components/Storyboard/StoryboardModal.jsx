import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createStoryboard,
  updateStoryboard,
} from '../../redux/slices/storyboardSlice';
import styles from './StoryboardModal.module.css';

const StoryboardModal = ({
  isOpen,
  storyboard,
  onClose,
  onSave,
  universeId,
}) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector(state => state.storyboard);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (storyboard) {
      setFormData({
        title: storyboard.title,
        description: storyboard.description || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
      });
    }
  }, [storyboard]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const action = storyboard
      ? updateStoryboard({
          universeId,
          storyboardId: storyboard.id,
          storyboard: formData,
        })
      : createStoryboard({
          universeId,
          storyboard: formData,
        });

    const result = await dispatch(action);
    if (!result.error) {
      onSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{storyboard ? 'Edit Storyboard' : 'Create New Storyboard'}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter storyboard title"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter storyboard description"
              className={styles.textarea}
              rows={4}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={status === 'loading'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <span className={styles.spinner} />
                  Saving...
                </>
              ) : storyboard ? (
                'Save Changes'
              ) : (
                'Create Storyboard'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

StoryboardModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  storyboard: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  universeId: PropTypes.string.isRequired,
};

export default StoryboardModal;
