import { useCallback, useState } from 'react';
import { useModalRoute } from '../providers/ModalProvider';
import { MODAL_TYPES } from '../utils/modalRegistry';

/**
 * Custom hook for managing modal state and interactions
 * @param {string} modalType - The type of modal (e.g., 'create', 'edit', 'delete')
 * @param {Object} options - Additional options for modal behavior
 * @returns {Object} Modal management methods and state
 */
const useModalManager = (modalType, options = {}) => {
  const {
    onSuccess,
    onError,
    preserveQueryParams = false,
    additionalParams = {},
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { openModalRoute, closeModalRoute, currentModal, currentModalId } = useModalRoute();

  // Open modal with optional ID and additional parameters
  const openModal = useCallback((id = null, params = {}) => {
    if (!modalType || !MODAL_TYPES[modalType]) {
      console.warn(`Invalid modal type: ${modalType}`);
      return;
    }

    setError(null);
    openModalRoute(MODAL_TYPES[modalType], id, {
      ...additionalParams,
      ...params,
    });
  }, [modalType, additionalParams, openModalRoute]);

  // Close modal with option to preserve query parameters
  const closeModal = useCallback(() => {
    setError(null);
    setLoading(false);
    closeModalRoute(preserveQueryParams);
  }, [preserveQueryParams, closeModalRoute]);

  // Handle modal submission
  const handleSubmit = useCallback(async (submitFn) => {
    try {
      setLoading(true);
      setError(null);

      const result = await submitFn();

      if (onSuccess) {
        await onSuccess(result);
      }

      closeModal();
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [closeModal, onSuccess, onError]);

  // Check if this modal is currently active
  const isActive = currentModal === MODAL_TYPES[modalType];

  return {
    openModal,
    closeModal,
    handleSubmit,
    loading,
    error,
    isActive,
    modalId: currentModalId,
    setError,
    setLoading,
  };
};

export default useModalManager;
