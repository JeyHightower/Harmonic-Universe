import { useState, useCallback } from 'react';

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
    console.log("useSceneModal - Opening create modal for universe:", universeId);

    setModalData({
      universeId,
      sceneId: null,
      initialData: null,
      successCallback: onSuccess,
    });
    setModalType('create');
    setIsOpen(true);

    console.log("useSceneModal - Create modal opened");
  }, []);

  // Function to open the edit scene modal
  const openEditModal = useCallback((universeId, scene, onSuccess) => {
    console.log("useSceneModal - Opening edit modal for scene:", scene.id);

    if (!scene || !scene.id) {
      console.error("useSceneModal - Cannot open edit modal: Scene is invalid", scene);
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

    console.log("useSceneModal - Edit modal opened with data:", {
      universeId,
      sceneId: scene.id,
      hasInitialData: !!scene
    });
  }, []);

  // Function to open the view scene modal
  const openViewModal = useCallback((scene) => {
    console.log("useSceneModal - Opening view modal for scene:", scene.id);

    if (!scene || !scene.id) {
      console.error("useSceneModal - Cannot open view modal: Scene is invalid", scene);
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

    console.log("useSceneModal - View modal opened");
  }, []);

  // Function to open the delete scene modal
  const openDeleteModal = useCallback((scene, onSuccess) => {
    console.log("useSceneModal - Opening delete modal for scene:", scene.id);

    if (!scene || !scene.id) {
      console.error("useSceneModal - Cannot open delete modal: Scene is invalid", scene);
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

    console.log("useSceneModal - Delete modal opened");
  }, []);

  // Function to close any open modal
  const closeModal = useCallback(() => {
    console.log("useSceneModal - Closing modal");

    setIsOpen(false);

    // We don't reset other state immediately to allow for exit animations
    setTimeout(() => {
      console.log("useSceneModal - Cleanup after modal close");
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
  const handleSuccess = useCallback((result) => {
    console.log("useSceneModal - handleSuccess called with:", result);

    if (modalData.successCallback) {
      console.log("useSceneModal - Calling success callback");
      modalData.successCallback(result);
    } else {
      console.log("useSceneModal - No success callback provided");
    }

    console.log("useSceneModal - Closing modal after success");
    closeModal();
  }, [modalData, closeModal]);

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