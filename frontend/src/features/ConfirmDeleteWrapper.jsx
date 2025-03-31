import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import ConfirmDeleteModal from "../../components/modals/ConfirmDeleteModal";
import { deleteScene } from "../../store/thunks/scenesThunks";

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedEntityType = null;
let savedEntityId = null;
let savedEntityName = null;
let currentOnCloseFn = null;
let currentOnConfirmFn = null;

const ConfirmDeleteWrapper = ({
  entityType,
  entityId,
  entityName,
  onConfirm,
  onClose,
  isGlobalModal = true,
}) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  const entityTypeRef = useRef(entityType);
  const entityIdRef = useRef(entityId);
  const entityNameRef = useRef(entityName);

  console.log("ConfirmDeleteWrapper rendering:", {
    entityType,
    entityId,
    entityName,
  });

  // Update refs when props change
  useEffect(() => {
    entityTypeRef.current = entityType;
    entityIdRef.current = entityId;
    entityNameRef.current = entityName;
    onCloseRef.current = onClose;
    onConfirmRef.current = onConfirm;
  }, [entityType, entityId, entityName, onClose, onConfirm]);

  // Set up visibility
  useEffect(() => {
    console.log("ConfirmDeleteWrapper useEffect running");

    // Save the data globally to persist across mounts
    if (entityId) {
      savedEntityType = entityType;
      savedEntityId = entityId;
      savedEntityName = entityName;
      currentOnCloseFn = onClose;
      currentOnConfirmFn = onConfirm;
      modalVisible = true;
      console.log("Setting modalVisible to true for ConfirmDeleteWrapper");
    }

    // Set local state
    setVisible(true);

    // Clean up function
    return () => {
      console.log("ConfirmDeleteWrapper cleanup function running");
      // Don't reset the global state on unmount - that's the key to our fix
    };
  }, [entityType, entityId, entityName, onClose, onConfirm]);

  // Function to safely close the modal
  const handleModalClose = () => {
    console.log("ConfirmDeleteWrapper handleModalClose called");
    modalVisible = false;
    savedEntityType = null;
    savedEntityId = null;
    savedEntityName = null;

    // Call the original onClose
    if (currentOnCloseFn) {
      currentOnCloseFn();
      currentOnCloseFn = null;
    }
    currentOnConfirmFn = null;
  };

  // Function to handle confirmation
  const handleConfirm = async () => {
    console.log("ConfirmDeleteWrapper handleConfirm called");
    const displayEntityType = entityType || savedEntityType;
    const displayEntityId = entityId || savedEntityId;

    setIsDeleting(true);

    try {
      // Handle entity deletion based on entity type
      if (displayEntityType === "scene") {
        console.log(`Deleting scene with ID: ${displayEntityId}`);
        await dispatch(deleteScene(displayEntityId)).unwrap();
        console.log("Scene deleted successfully");
      } else {
        // For other entity types, use the provided callback
        if (currentOnConfirmFn) {
          await currentOnConfirmFn(displayEntityId);
        }
      }

      // Close the modal
      handleModalClose();

      // Do NOT automatically reload the page
      // Instead, let the onConfirm callback handle any UI updates
    } catch (error) {
      console.error(`Error deleting ${displayEntityType}:`, error);
      // We'll still close the modal even if there's an error
      handleModalClose();
    } finally {
      setIsDeleting(false);
    }
  };

  // If we don't have required data or modal is not visible, don't render
  if ((!entityId && !savedEntityId) || !modalVisible) {
    console.log(
      "ConfirmDeleteWrapper returning null - missing required data or not visible"
    );
    return null;
  }

  // Use saved values if current props are null
  const displayEntityType = entityType || savedEntityType || "item";
  const displayEntityId = entityId || savedEntityId;
  const displayEntityName = entityName || savedEntityName || "";

  console.log("ConfirmDeleteWrapper rendering modal with:", {
    displayEntityType,
    displayEntityId,
    displayEntityName,
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        // Only close if the backdrop itself was clicked
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          pointerEvents: "auto",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ConfirmDeleteModal
          entityType={displayEntityType}
          entityId={displayEntityId}
          entityName={displayEntityName}
          onConfirm={handleConfirm}
          onClose={handleModalClose}
          isGlobalModal={isGlobalModal}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default ConfirmDeleteWrapper;
