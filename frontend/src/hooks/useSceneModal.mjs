import { useCallback, useState } from 'react';

// Define window globals to fix ESLint errors
const { setTimeout } = window;

/**
 * Custom hook for managing scene modals
 * This provides a consistent interface for handling all scene-related modals
 */
const useSceneModal = () => {
  // State to track modal visibility
  const [isOpen, setIsOpen] = useState(false);

  // State to track modal type (create, edit, view, delete)
  const [modalType, setModalType] = useState(null);

  // State to store data needed for the modal
  const [modalData, setModalData] = useState({
    universeId: null,
    sceneId: null,
    initialData: null,
    successCallback: null,
  });

  // Function to open the create scene modal
  const openCreateModal = useCallback((universeId, onSuccess) => {
    setModalData({
      universeId,
      sceneId: null,
      initialData: null,
      successCallback: onSuccess,
    });
    setModalType('create');
    setIsOpen(true);
  }, []);

  // Function to open the edit scene modal
  const openEditModal = useCallback((universeId, scene, onSuccess) => {
    if (!scene || !scene.id) {
      console.error('useSceneModal - Cannot open edit modal: Scene is invalid', scene);
      return;
    }

    setModalData({
      universeId,
      sceneId: scene.id,
      initialData: scene,
      successCallback: onSuccess,
    });
    setModalType('edit');
    setIsOpen(true);
  }, []);

  // Function to open the view scene modal
  const openViewModal = useCallback((scene) => {
    if (!scene || !scene.id) {
      console.error('useSceneModal - Cannot open view modal: Scene is invalid', scene);
      return;
    }

    setModalData({
      universeId: scene.universe_id,
      sceneId: scene.id,
      initialData: scene,
      successCallback: null,
    });
    setModalType('view');
    setIsOpen(true);
  }, []);

  // Function to open the delete scene modal
  const openDeleteModal = useCallback((scene, onSuccess) => {
    if (!scene || !scene.id) {
      console.error('useSceneModal - Cannot open delete modal: Scene is invalid', scene);
      return;
    }

    setModalData({
      universeId: scene.universe_id,
      sceneId: scene.id,
      initialData: scene,
      successCallback: onSuccess,
    });
    setModalType('delete');
    setIsOpen(true);
  }, []);

  // Function to close any open modal
  const closeModal = useCallback(() => {
    setIsOpen(false);

    // We don't reset other state immediately to allow for exit animations
    setTimeout(() => {
      setModalType(null);
      setModalData({
        universeId: null,
        sceneId: null,
        initialData: null,
        successCallback: null,
      });
    }, 300); // Should match transition duration
  }, []);

  // Function to handle modal success
  const handleSuccess = useCallback(
    (result) => {
      if (modalData.successCallback) {
        modalData.successCallback(result);
      }
      closeModal();
    },
    [modalData, closeModal]
  );

  return {
    isOpen,
    modalType,
    modalData,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    handleSuccess,
  };
};

export default useSceneModal;
