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

// Create a stable component with React.memo to prevent unnecessary re-renders
const UniverseFormModal = React.memo(
  ({ onClose, initialData = null, isGlobalModal = true, modalId = null }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.universe);

    // Track mount time for stability checks
    const mountTimeRef = useRef(Date.now());
    const formRef = useRef(null);
    const submitAttemptedRef = useRef(false);
    const isSubmittingRef = useRef(false);

    // Form state
    const [formData, setFormData] = useState({
      name: initialData?.name || '',
      description: initialData?.description || '',
      theme: initialData?.theme || 'fantasy',
      visibility: initialData?.visibility || 'private',
    });

    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Log mount for debugging
    useEffect(() => {
      console.log(
        `UniverseFormModal mounted at ${new Date(
          mountTimeRef.current
        ).toISOString()}`
      );

      // Cleanup function that logs unmounting
      return () => {
        const unmountTime = Date.now();
        const mountDuration = unmountTime - mountTimeRef.current;
        console.log(`UniverseFormModal unmounting after ${mountDuration}ms`);

        // If unmounting during submission, log warning
        if (isSubmittingRef.current) {
          console.warn('Modal unmounting during active submission!');
        }
      };
    }, []);

    // Handle input changes
    const handleChange = useCallback(
      e => {
        const { name, value } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));

        // Clear error for this field when user changes it
        if (formErrors[name]) {
          setFormErrors(prev => ({
            ...prev,
            [name]: null,
          }));
        }
      },
      [formErrors]
    );

    // Validate form
    const validateForm = useCallback(() => {
      const errors = {};

      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      } else if (formData.name.length > 50) {
        errors.name = 'Name must be less than 50 characters';
      }

      if (formData.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(
      async e => {
        e.preventDefault();
        submitAttemptedRef.current = true;

        if (!validateForm()) {
          return;
        }

        try {
          isSubmittingRef.current = true;
          setIsSubmitting(true);

          console.log('Submitting universe form:', formData);

          const action = initialData
            ? updateUniverse({ id: initialData.id, ...formData })
            : createUniverse(formData);

          const result = await dispatch(action).unwrap();
          console.log('Universe saved successfully:', result);

          setSubmitSuccess(true);

          // Delay closing to show success state
          setTimeout(() => {
            if (onClose) onClose(result);
          }, 1000);
        } catch (err) {
          console.error('Error saving universe:', err);
          setFormErrors(prev => ({
            ...prev,
            submit: err.message || 'Failed to save universe. Please try again.',
          }));
        } finally {
          setIsSubmitting(false);
          isSubmittingRef.current = false;
        }
      },
      [dispatch, formData, initialData, onClose, validateForm]
    );

    // Handle cancel/close
    const handleCancel = useCallback(
      e => {
        e.preventDefault();

        // Confirm if user has entered data
        if (
          formData.name ||
          formData.description ||
          (initialData &&
            (formData.name !== initialData.name ||
              formData.description !== initialData.description ||
              formData.theme !== initialData.theme ||
              formData.visibility !== initialData.visibility))
        ) {
          if (
            !window.confirm(
              'Are you sure you want to cancel? Any unsaved changes will be lost.'
            )
          ) {
            return;
          }
        }

        if (onClose) onClose();
      },
      [formData, initialData, onClose]
    );

    // Create modal content
    const modalContent = useMemo(
      () => (
        <div className="universe-form-modal">
          <div className="universe-form-modal-content">
            <div className="universe-form-modal-header">
              <h2>{initialData ? 'Edit Universe' : 'Create New Universe'}</h2>
              <button
                className="universe-form-modal-close"
                onClick={handleCancel}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="universe-form"
            >
              {submitSuccess ? (
                <div className="universe-form-success">
                  <h3>Success!</h3>
                  <p>
                    {initialData
                      ? 'Universe updated successfully!'
                      : 'Universe created successfully!'}
                  </p>
                  <Spinner size="small" />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Universe Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter a name for your universe"
                      required
                      maxLength={50}
                      disabled={isSubmitting}
                    />
                    {formErrors.name && (
                      <div className="form-error">{formErrors.name}</div>
                    )}
                    <small>{formData.name.length}/50 characters</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your universe (optional)"
                      rows={4}
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                    {formErrors.description && (
                      <div className="form-error">{formErrors.description}</div>
                    )}
                    <small>{formData.description.length}/500 characters</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="theme">Theme</label>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      disabled={isSubmitting}
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

                  <div className="form-group">
                    <label htmlFor="visibility">Visibility</label>
                    <select
                      id="visibility"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="private">
                        Private (Only you can view)
                      </option>
                      <option value="public">Public (Anyone can view)</option>
                    </select>
                  </div>

                  {formErrors.submit && (
                    <div className="form-error submit-error">
                      {formErrors.submit}
                    </div>
                  )}

                  <div className="form-actions">
                    <Button
                      type="button"
                      onClick={handleCancel}
                      variant="secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                    >
                      {initialData ? 'Update Universe' : 'Create Universe'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      ),
      [
        formData,
        formErrors,
        handleCancel,
        handleChange,
        handleSubmit,
        initialData,
        isSubmitting,
        submitSuccess,
      ]
    );

    // For direct rendering, return the modal content directly
    if (!isGlobalModal) {
      return <div className="universe-form-modal-overlay">{modalContent}</div>;
    }

    // For global modal system, return just the content
    return modalContent;
  }
);

UniverseFormModal.displayName = 'UniverseFormModal';

export default UniverseFormModal;
