import React, { useEffect, useRef, useState } from "react";
import SceneFormModal from "./SceneFormModal";

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedUniverseId = null;
let savedInitialData = null;
let currentOnCloseFn = null;
let currentOnSuccessFn = null;

const SceneCreateModal = ({ universeId, initialData, onClose, onSuccess }) => {
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  const universeIdRef = useRef(universeId);
  const initialDataRef = useRef(initialData);

  console.log("SceneCreateModal rendering:", { universeId, initialData });

  // Update refs when props change
  useEffect(() => {
    universeIdRef.current = universeId;
    initialDataRef.current = initialData;
    onCloseRef.current = onClose;
    onSuccessRef.current = onSuccess;
  }, [universeId, initialData, onClose, onSuccess]);

  // Set up visibility
  useEffect(() => {
    console.log("SceneCreateModal useEffect running");

    // Save the data globally to persist across mounts
    if (universeId) {
      savedUniverseId = universeId;
      savedInitialData = initialData;
      currentOnCloseFn = onClose;
      currentOnSuccessFn = onSuccess;
      modalVisible = true;
      console.log("Setting modalVisible to true for SceneCreateModal");
    }

    // Set local state
    setVisible(true);

    // Clean up function
    return () => {
      console.log("SceneCreateModal cleanup function running");
      // Don't reset the global state on unmount - that's the key to our fix
    };
  }, [universeId, initialData, onClose, onSuccess]);

  // Function to safely close the modal
  const handleModalClose = () => {
    console.log("SceneCreateModal handleModalClose called");
    modalVisible = false;
    savedUniverseId = null;
    savedInitialData = null;

    // Call the original onClose
    if (currentOnCloseFn) {
      currentOnCloseFn();
      currentOnCloseFn = null;
    }
    currentOnSuccessFn = null;
  };

  // Function to handle scene creation success
  const handleSuccess = (data) => {
    console.log("SceneCreateModal handleSuccess called with data:", data);

    // Call success callback if provided
    if (currentOnSuccessFn) {
      currentOnSuccessFn(data);
    }

    // Close the modal
    handleModalClose();

    // Don't reload the page, let the parent component handle navigation
  };

  // If we don't have universe data or modal shouldn't be visible, don't render
  if ((!universeId && !savedUniverseId) || !modalVisible) {
    console.log(
      "SceneCreateModal returning null - missing required data or not visible"
    );
    return null;
  }

  // Use saved values if current props are null
  const displayUniverseId = universeId || savedUniverseId;
  const displayInitialData = initialData || savedInitialData;

  console.log("SceneCreateModal rendering form with:", { displayUniverseId });

  return (
    <div style={{ pointerEvents: "auto" }}>
      <SceneFormModal
        universeId={displayUniverseId}
        initialData={displayInitialData}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        isCreating={true}
      />
    </div>
  );
};

export default SceneCreateModal;
