import PropTypes from 'prop-types';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalModal from './GlobalModal';
import { ModalProvider as ContextModalProvider } from '../../contexts/ModalContext';

const ModalProvider = ({ children }) => {
  return (
    <ContextModalProvider>
      {children}
      <GlobalModal />
    </ContextModalProvider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook for using modals with routing (for backward compatibility)
export const useModalRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const openModalRoute = (modalType, modalId = null, queryParams = {}) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('modal', modalType);
    if (modalId) searchParams.set('modalId', modalId);

    // Add additional query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      searchParams.set(key, value);
    });

    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const closeModalRoute = (preserveQueryParams = false) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('modal');
    searchParams.delete('modalId');

    if (!preserveQueryParams) {
      navigate(location.pathname);
    } else {
      navigate(
        `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      );
    }
  };

  const currentModal = new URLSearchParams(location.search).get('modal');
  const currentModalId = new URLSearchParams(location.search).get('modalId');

  return {
    openModalRoute,
    closeModalRoute,
    currentModal,
    currentModalId,
    isModalOpen: !!currentModal,
  };
};

export default ModalProvider;
