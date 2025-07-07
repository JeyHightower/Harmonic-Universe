import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../../components/common/Button.jsx';
import Input from '../../../components/common/Input.jsx';
import {
  applyInteractionFixes,
  selectInteractionFixes,
  selectInteractionFixesApplied,
  selectModalZIndexLevels,
} from '../../../store/slices/newModalSlice';
import { createUniverse, updateUniverse } from '../../../store/thunks/universeThunks';
import {
  applyModalFixes,
  ensurePortalRoot,
  forceModalInteractivity,
} from '../../../utils/portalUtils';
import '../styles/UniverseFormModal.css';

/**
 * Universe Modal component for creating, editing, or viewing a universe
 *
 * Consolidated version that supports multiple modes and replaces both
 * the original UniverseModal and UniverseModalComponent
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {boolean} props.open - Alternative prop for isOpen for compatibility
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onSuccess - Function to call when the operation is successful
 * @param {Object} props.universe - Universe data for editing or viewing
 * @param {string} props.mode - Modal mode: 'create', 'edit', or 'view' (overrides isEdit)
 * @param {boolean} props.isEdit - Whether the modal is in edit mode (legacy)
 */
const UniverseModal = ({
  isOpen,
  open,
  onClose,
  onSuccess,
  universe = null,
  mode,
  isEdit = false,
}) => {
  const dispatch = useDispatch();
  const { loading, error: storeError } = useSelector((state) => state.universes);
  const interactionFixesApplied = useSelector(selectInteractionFixesApplied);
  const zIndexLevels = useSelector(selectModalZIndexLevels);
  const interactionFixes = useSelector(selectInteractionFixes);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const modalRef = useRef(null);
  const fixesAppliedRef = useRef(false);

  // Determine the actual mode from props
  const actualMode = mode || (isEdit ? 'edit' : 'create');
  const isViewMode = actualMode === 'view';
  const isEditMode = actualMode === 'edit';
  const isCreateMode = actualMode === 'create';

  // Backwards compatibility for open/isOpen props
  const isModalOpen = open || isOpen || false;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    theme: '',
    is_public: false,
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Initialize form with data if editing or viewing
  useEffect(() => {
    console.log('UniverseModal - Initializing with universe:', universe);
    if (universe && (isEditMode || isViewMode)) {
      setFormData({
        name: universe.name || '',
        description: universe.description || '',
        genre: universe.genre || '',
        theme: universe.theme || '',
        is_public: universe.is_public || false,
      });
    } else if (isCreateMode) {
      // Reset form when creating new
      setFormData({
        name: '',
        description: '',
        genre: '',
        theme: '',
        is_public: false,
      });
    }
  }, [universe, isEditMode, isViewMode, isCreateMode]);

  // Apply modal fixes when the modal is opened
  useEffect(() => {
    if (isModalOpen && !fixesAppliedRef.current) {
      console.log('UniverseModal opened - applying interaction fixes directly');

      // First ensure the portal root exists
      ensurePortalRoot();

      // Apply fixes directly to DOM
      applyModalFixes();
      forceModalInteractivity();

      // Only dispatch once to prevent multiple dispatches
      if (!fixesAppliedRef.current && !interactionFixesApplied) {
        try {
          dispatch(
            applyInteractionFixes({
              zIndex: {
                baseModal: 1050,
                baseContent: 1055,
                baseForm: 1060,
                baseInputs: 1065,
              },
            })
          );
          fixesAppliedRef.current = true;
        } catch (error) {
          console.error('Failed to apply interaction fixes:', error);
        }
      }

      // Focus the name input if it exists
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }

    // Clean up fixes ref when modal closes
    if (!isModalOpen) {
      fixesAppliedRef.current = false;
    }
  }, [isModalOpen, dispatch, interactionFixesApplied]);

  // Apply additional fixes when the modal element is available
  useEffect(() => {
    if (isModalOpen && modalRef.current && !interactionFixesApplied) {
      console.log('Applying specific fixes to modal element');
      // Apply fixes directly to the modal element
      if (modalRef.current) {
        modalRef.current.style.zIndex = '1050';
        modalRef.current.style.pointerEvents = 'auto';
      }
    }
  }, [isModalOpen, interactionFixesApplied]);

  // Add debug logging for modal state
  useEffect(() => {
    console.log('UniverseModal state:', {
      isModalOpen,
      isEditMode,
      isViewMode,
      isCreateMode,
      hasUniverse: !!universe,
      formData,
      interactionFixesApplied,
      interactionFixesState: interactionFixes,
    });
  }, [
    isModalOpen,
    isEditMode,
    isViewMode,
    isCreateMode,
    universe,
    formData,
    interactionFixesApplied,
    interactionFixes,
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    e.stopPropagation(); // Stop event propagation

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle input focus
  const handleInputFocus = (e) => {
    e.stopPropagation();
    console.log('Input focused:', e.target.name);
  };

  // Handle clicks on form elements
  const handleFormElementClick = (e) => {
    e.stopPropagation();
    console.log('Form element clicked:', e.target.tagName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('UniverseModal - Submitting universe data:', formData);

      // Call the appropriate action based on whether we're creating or editing
      const result = isEditMode
        ? await dispatch(updateUniverse({ id: universe.id, ...formData })).unwrap()
        : await dispatch(createUniverse(formData)).unwrap();

      console.log('UniverseModal - Universe saved successfully:', result);

      // Extract the universe data from the result
      let resultUniverse = null;
      if (result?.universe) {
        resultUniverse = result.universe;
      } else if (result?.id) {
        resultUniverse = result;
      }

      // Call the success callback with the result first
      if (onSuccess && resultUniverse) {
        onSuccess(resultUniverse, isEditMode ? 'edit' : 'create');
      }

      // Then close the modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('UniverseModal - Failed to save universe:', err);
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'Failed to save universe. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (actualMode) {
      case 'create':
        return 'Create New Universe';
      case 'edit':
        return 'Edit Universe';
      case 'view':
        return 'Universe Details';
      default:
        return 'Universe';
    }
  };

  // Handle dialog close to prevent accidental closures
  const handleDialogClose = (e, reason) => {
    // Only close if it's an explicit close action, not a backdrop click
    if (reason !== 'backdropClick') {
      onClose && onClose();
    }
  };

  // Z-index values from Redux
  const baseModalZIndex = zIndexLevels.baseModal || 1050;
  const baseContentZIndex = zIndexLevels.baseContent || 1055;
  const baseFormZIndex = zIndexLevels.baseForm || 1060;
  const baseInputsZIndex = zIndexLevels.baseInputs || 1065;

  return (
    <Dialog
      open={isModalOpen}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      className="universe-form-modal redux-modal-fix"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Dialog clicked');
      }}
      disableEnforceFocus
      disableAutoFocus
      disablePortal={false}
      ref={modalRef}
      container={document.getElementById('portal-root')}
      style={{
        position: 'relative',
        zIndex: baseModalZIndex,
      }}
      data-modal-type="universe"
      BackdropProps={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: baseModalZIndex - 5,
        },
        onClick: (e) => {
          e.stopPropagation();
          // Only close if clicking the backdrop itself
          if (e.target === e.currentTarget) {
            handleDialogClose(e, 'backdropClick');
          }
        },
      }}
      hideBackdrop={true}
    >
      <DialogTitle
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: baseContentZIndex }}
      >
        {getModalTitle()}
      </DialogTitle>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: baseContentZIndex }}
      >
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          className="universe-form universe-form-compact"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: baseFormZIndex }}
        >
          <Input
            label="Universe Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onClick={handleFormElementClick}
            error={errors.name}
            required
            className="compact-input"
            disabled={isViewMode || isSubmitting}
            ref={nameInputRef}
            style={{
              position: 'relative',
              zIndex: baseInputsZIndex,
              pointerEvents: 'auto',
            }}
          />

          <Input
            label="Description"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onClick={handleFormElementClick}
            error={errors.description}
            rows={3}
            disabled={isViewMode || isSubmitting}
            style={{
              position: 'relative',
              zIndex: baseInputsZIndex,
              pointerEvents: 'auto',
            }}
          />

          <Input
            label="Genre"
            name="genre"
            type="text"
            value={formData.genre}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onClick={handleFormElementClick}
            error={errors.genre}
            disabled={isViewMode || isSubmitting}
            style={{
              position: 'relative',
              zIndex: baseInputsZIndex,
              pointerEvents: 'auto',
            }}
          />

          <Input
            label="Theme"
            name="theme"
            type="text"
            value={formData.theme}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onClick={handleFormElementClick}
            error={errors.theme}
            disabled={isViewMode || isSubmitting}
            style={{
              position: 'relative',
              zIndex: baseInputsZIndex,
              pointerEvents: 'auto',
            }}
          />

          <div
            className="checkbox-group"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              zIndex: baseInputsZIndex,
            }}
          >
            <label
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                zIndex: baseInputsZIndex + 1,
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Checkbox clicked');
                  handleFormElementClick(e);
                }}
                disabled={isViewMode || isSubmitting}
                style={{
                  position: 'relative',
                  zIndex: baseInputsZIndex + 2,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
              />
              Make Universe Public
            </label>
            <small>Public universes can be viewed by other users</small>
          </div>

          {errors.form && (
            <div className="form-error" role="alert">
              {errors.form}
            </div>
          )}

          {storeError && (
            <div className="form-error" role="alert">
              {typeof storeError === 'string' ? storeError : 'An error occurred. Please try again.'}
            </div>
          )}

          {!isViewMode && (
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose && onClose();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || loading}
                loading={isSubmitting}
              >
                {isEditMode ? 'Update Universe' : 'Create Universe'}
              </Button>
            </div>
          )}

          {isViewMode && (
            <div className="form-actions">
              <Button
                type="button"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose && onClose();
                }}
              >
                Close
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

UniverseModal.propTypes = {
  isOpen: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  universe: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit', 'view']),
  isEdit: PropTypes.bool,
};

export default UniverseModal;
