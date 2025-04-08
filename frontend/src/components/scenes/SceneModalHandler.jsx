import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ModalSystem } from "../modals";
import { MODAL_CONFIG, IS_PRODUCTION } from "../../utils/config";
import SceneForm from "./SceneForm";
import SceneDeleteConfirmation from "./SceneDeleteConfirmation";
import SceneViewer from "./SceneViewer";
import apiClient from "../../services/api";
import { useDispatch } from "react-redux";
import { addScene } from "../../store/slices/scenesSlice";

/**
 * SceneModalHandler - Component to handle scene-related modals using the original modal system
 *
 * This component uses the original Modal component pattern for handling scene operations
 * like create, edit, view, and delete.
 */
const SceneModalHandler = ({
  isOpen,
  onClose,
  modalType = "create",
  universeId,
  sceneId,
  initialData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  // Log the props when the component is rendered
  useEffect(() => {
    console.log("SceneModalHandler rendering with props:", {
      isOpen,
      modalType,
      universeId,
      sceneId,
      initialData: initialData ? `Scene ${initialData.id}` : null,
    });
  }, [isOpen, modalType, universeId, sceneId, initialData]);

  // Determine the modal title based on modal type
  const getModalTitle = () => {
    switch (modalType) {
      case "create":
        return "Create New Scene";
      case "edit":
        return "Edit Scene";
      case "view":
        return "Scene Details";
      case "delete":
        return "Delete Scene";
      default:
        return "Scene";
    }
  };

  // Handler for form submission result
  const handleFormResult = async (action, formValues) => {
    console.log(
      "SceneModalHandler - handleFormResult called with action:",
      action,
      "and data:",
      formValues
    );

    // Clear previous errors
    setError(null);

    try {
      setLoading(true);

      // If this is a create operation, we need to call the API ourselves
      if (modalType === "create" || action === "create") {
        console.log(
          "SceneModalHandler - Creating new scene with values:",
          formValues
        );

        // DEBUGGING: Log all properties of formValues to understand what's being received
        console.log("DEBUG - formValues properties:", Object.keys(formValues));
        console.log(
          "DEBUG - name value:",
          formValues.name,
          typeof formValues.name
        );
        console.log(
          "DEBUG - summary value:",
          formValues.summary,
          typeof formValues.summary
        );

        // Validate required fields before proceeding
        if (!formValues.name) {
          console.error("SceneModalHandler - Missing scene name in form data");
          throw new Error("Scene name is required");
        }

        if (!formValues.summary) {
          console.error(
            "SceneModalHandler - Missing scene summary in form data"
          );
          throw new Error("Scene summary is required");
        }

        try {
          // Ensure universeId is properly included
          const sceneData = {
            ...formValues,
            universe_id: universeId || formValues.universe_id,
          };

          // Extra validation to ensure critical fields are strings
          if (sceneData.name) {
            sceneData.name = String(sceneData.name).trim();
          }

          if (sceneData.summary) {
            sceneData.summary = String(sceneData.summary).trim();
          }

          console.log(
            "SceneModalHandler - FINAL scene data being sent to API:",
            sceneData
          );

          const response = await apiClient.createScene(sceneData);
          console.log("SceneModalHandler - API response:", response);

          // Check for API errors even with successful HTTP status
          if (response.error || (response.data && response.data.error)) {
            throw new Error(
              response.data?.error || response.error || "Error creating scene"
            );
          }

          // Extract the new scene data from response
          let newScene;
          if (response.data?.scene) {
            newScene = response.data.scene;
          } else if (response.data) {
            newScene = response.data;
          } else {
            // Fallback if response format is unexpected
            newScene = {
              ...sceneData,
              id: `temp_${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            console.warn(
              "SceneModalHandler - Unexpected API response format, using fallback:",
              newScene
            );
          }

          // Add scene to Redux store directly to ensure it appears in the list
          dispatch(addScene(newScene));

          // Pass the scene data to the parent's onSuccess callback with actionType
          if (onSuccess) {
            onSuccess(action, newScene);
          }

          // Close the modal
          if (onClose) {
            onClose();
          }

          return newScene;
        } catch (error) {
          console.error("SceneModalHandler - Error creating scene:", error);
          setError(
            error.response?.data?.error ||
              error.message ||
              "Failed to create scene"
          );
          throw error;
        }
      } else {
        // For other operations (edit, delete), let the parent handle it
        if (typeof onSubmit === "function") {
          return onSubmit(action, formValues);
        } else {
          console.error(
            "SceneModalHandler - onSubmit prop is not defined for non-create operations"
          );
          throw new Error("Operation not supported");
        }
      }
    } catch (error) {
      console.error("SceneModalHandler - Error in form result handler:", error);
      setError(
        error.response?.data?.error || error.message || "An error occurred"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handler for cancel action
  const handleCancel = () => {
    console.log("SceneModalHandler - handleCancel called");
    setError(null);
    onClose();
  };

  // Determine which component to render based on modalType
  const renderModalContent = () => {
    console.log("SceneModalHandler - renderModalContent for type:", modalType);

    switch (modalType) {
      case "create":
        return (
          <>
            {error && (
              <div
                className="modal-error-message"
                style={{ color: "red", marginBottom: "1rem" }}
              >
                {error}
              </div>
            )}
            <SceneForm
              universeId={universeId}
              onSubmit={handleFormResult}
              onCancel={handleCancel}
              loading={loading}
            />
          </>
        );
      case "edit":
        console.log(
          "SceneModalHandler - Rendering edit form with scene:",
          initialData?.id
        );
        return (
          <>
            {error && (
              <div
                className="modal-error-message"
                style={{ color: "red", marginBottom: "1rem" }}
              >
                {error}
              </div>
            )}
            <SceneForm
              universeId={universeId}
              sceneId={sceneId}
              initialData={initialData}
              onSubmit={handleFormResult}
              onCancel={handleCancel}
              loading={loading}
            />
          </>
        );
      case "delete":
        return (
          <>
            {error && (
              <div
                className="modal-error-message"
                style={{ color: "red", marginBottom: "1rem" }}
              >
                {error}
              </div>
            )}
            <SceneDeleteConfirmation
              scene={initialData}
              onConfirm={handleFormResult}
              onCancel={handleCancel}
              loading={loading}
            />
          </>
        );
      case "view":
        return <SceneViewer scene={initialData} onClose={handleCancel} />;
      default:
        return <div>Invalid modal type</div>;
    }
  };

  if (!isOpen) {
    console.log("SceneModalHandler - Not rendering because isOpen is false");
    return null;
  }

  return (
    <ModalSystem
      isOpen={isOpen}
      onClose={handleCancel}
      title={getModalTitle()}
      size={MODAL_CONFIG.SIZES.LARGE}
      type={
        modalType === "delete"
          ? MODAL_CONFIG.TYPES.DANGER
          : MODAL_CONFIG.TYPES.DEFAULT
      }
      showCloseButton={true}
      closeOnEscape={true}
      closeOnBackdrop={true}
    >
      {renderModalContent()}
    </ModalSystem>
  );
};

SceneModalHandler.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  modalType: PropTypes.oneOf(["create", "edit", "view", "delete"]),
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default SceneModalHandler;
