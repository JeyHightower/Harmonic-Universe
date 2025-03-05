import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import {
  createUniverse,
  updateUniverse,
} from '../../store/thunks/universeThunks';
import './UniverseFormModal.css';

// Maintain a global reference to the active callback
let currentOnCloseFn = null;

// Create a global state for tracking if the modal is currently visible
let modalVisible = false;

// Use a global variable to store the modal state between unmounts
let savedInitialData = null;

// The actual modal content component
const UniverseFormModalContent = React.memo(({ initialData, onClose }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.universe);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    theme: initialData?.theme || 'fantasy',
    visibility: initialData?.is_public ? 'public' : 'private',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reference to the modal container for click handling
  const modalContainerRef = useRef(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters';
    }

    if (formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    return errors;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      let result;
      if (initialData) {
        // Update
        result = await dispatch(updateUniverse({ id: initialData.id, ...formData })).unwrap();
        console.log('Universe updated successfully:', result);
      } else {
        // Create
        result = await dispatch(createUniverse(formData)).unwrap();
        console.log('Universe created successfully:', result);
      }

      setSubmitSuccess(true);

      // Close after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (
      formData.name ||
      formData.description ||
      (initialData &&
        (formData.name !== initialData.name ||
          formData.description !== initialData.description ||
          formData.theme !== initialData.theme ||
          formData.visibility !== (initialData.is_public ? 'public' : 'private')))
    ) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close this window?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [formData, initialData, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === modalContainerRef.current) {
      handleCancel();
    }
  }, [handleCancel]);

  // Ensure modal stays visible even if parent unmounts
  useEffect(() => {
    // Set global state to visible
    modalVisible = true;

    // Make body not scrollable
    document.body.style.overflow = 'hidden';

    console.log('Modal content mounted with initialData:', initialData?.id || 'new');

    // Clean up on unmount - but we'll intercept this in the parent component
    return () => {
      console.log('Modal content unmounting - will be intercepted if needed');
      document.body.style.overflow = '';
      modalVisible = false;
    };
  }, [initialData]);

  // Return the rendered modal
  return (
    <div
      ref={modalContainerRef}
      className="universe-form-modal-overlay"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <div
        className="universe-form-modal-container"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="universe-form-modal-header" style={{
          padding: '16px 24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>
            {initialData ? 'Edit Universe' : 'Create New Universe'}
          </h2>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="universe-form"
          style={{ padding: '24px', pointerEvents: 'auto' }}
        >
          {submitSuccess ? (
            <div className="universe-form-success" style={{ textAlign: 'center', padding: '20px' }}>
              <h3>Success!</h3>
              <p>
                {initialData
                  ? 'Universe updated successfully!'
                  : 'Universe created successfully!'}
              </p>
              <Button onClick={onClose} type="primary">Close</Button>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Universe Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter universe name"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    pointerEvents: 'auto'
                  }}
                />
                {formErrors.name && (
                  <div className="form-error" style={{ color: 'red', marginTop: '4px', fontSize: '14px' }}>
                    {formErrors.name}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter a brief description of your universe"
                  rows={4}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    pointerEvents: 'auto'
                  }}
                />
                {formErrors.description && (
                  <div className="form-error" style={{ color: 'red', marginTop: '4px', fontSize: '14px' }}>
                    {formErrors.description}
                  </div>
                )}
                <small style={{ display: 'block', textAlign: 'right', color: '#777' }}>
                  {formData.description.length}/500 characters
                </small>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="theme" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    pointerEvents: 'auto'
                  }}
                >
                  <option value="fantasy">Fantasy</option>
                  <option value="sci-fi">Science Fiction</option>
                  <option value="historical">Historical</option>
                  <option value="modern">Modern</option>
                  <option value="post-apocalyptic">Post-Apocalyptic</option>
                  <option value="superhero">Superhero</option>
                  <option value="horror">Horror</option>
                  <option value="mystery">Mystery</option>
                  <option value="western">Western</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="visibility" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Visibility
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    pointerEvents: 'auto'
                  }}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <small style={{ display: 'block', color: '#777', marginTop: '4px' }}>
                  {formData.visibility === 'public'
                    ? 'Anyone can view this universe'
                    : 'Only you can view this universe'}
                </small>
              </div>

              <div className="form-actions" style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <Button
                  type="secondary"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{ pointerEvents: 'auto' }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  style={{ pointerEvents: 'auto' }}
                >
                  {initialData ? 'Update Universe' : 'Create Universe'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
});

// Main component that handles modal lifecycle
const UniverseFormModal = React.memo(
  ({ onClose, initialData = null, isGlobalModal = true, modalId = null, isEditing = false, modalProps = {} }) => {
    // Track if this component is the current "active" instance
    const isActiveInstanceRef = useRef(true);

    // Prevent instant remounting
    const mountTimeRef = useRef(Date.now());

    // Store references to props to ensure stability
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const initialDataRef = useRef(initialData);
    initialDataRef.current = initialData;

    // Local state for controlled opening/closing
    const [localVisible, setLocalVisible] = useState(true);

    // On mount, save this instance as the active one and save initialData
    useEffect(() => {
      console.log('UniverseFormModal mounted with id:', modalId);

      // If modal was already visible (from another instance), use saved data
      if (modalVisible && savedInitialData) {
        initialDataRef.current = savedInitialData;
      } else {
        // Otherwise save this instance's data
        savedInitialData = initialData;
      }

      // Set this as active instance
      isActiveInstanceRef.current = true;
      currentOnCloseFn = onCloseRef.current;

      return () => {
        console.log('UniverseFormModal unmounting with id:', modalId);

        // Only clear if this is the active instance
        if (isActiveInstanceRef.current) {
          // Keep modal data active for 1 second in case of remount
          setTimeout(() => {
            if (!modalVisible) {
              savedInitialData = null;
              currentOnCloseFn = null;
            }
          }, 1000);
        }
      };
    }, [modalId, initialData]);

    // Stabilized close handler
    const handleClose = useCallback(() => {
      console.log('handleClose called in UniverseFormModal');
      setLocalVisible(false);

      setTimeout(() => {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }, 100);
    }, []);

    // If modal content is unmounted but should still be visible,
    // it will be remounted on next render cycle

    // Only render if visible
    if (!localVisible) {
      return null;
    }

    return (
      <UniverseFormModalContent
        initialData={initialDataRef.current}
        onClose={handleClose}
      />
    );
  }
);

UniverseFormModal.displayName = 'UniverseFormModal';

export default UniverseFormModal;
