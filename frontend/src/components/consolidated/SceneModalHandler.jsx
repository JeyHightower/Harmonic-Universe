import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ModalSystem } from "../modals";
import { MODAL_CONFIG } from "../../utils/config";
import SceneForm from "./SceneForm";
import SceneDeleteConfirmation from "./SceneDeleteConfirmation";
import SceneViewer from "./SceneViewer";
import apiClient from "../../services/api";

/**
 * SceneModalHandler - Component to handle scene-related modals using the original modal system
 *
 * This component uses the original Modal component pattern for handling scene operations
 * like create, edit, view, and delete.
 */
const SceneModalHandler = ({
  isOpen,
  onClose,
  modalType,
  universeId,
  sceneId,
  initialData,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

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
  const handleFormResult = async (formValues) => {
    console.log(
      "SceneModalHandler - handleFormResult called with:",
      formValues
    );

    try {
      setLoading(true);

      // If this is a create operation, we need to call the API ourselves
      if (modalType === "create") {
        console.log(
          "SceneModalHandler - Creating new scene with values:",
          formValues
        );
        const response = await apiClient.createScene(formValues);
        console.log("SceneModalHandler - API response:", response);

        // Extract the new scene data from response
        let newScene;
        if (response.data?.scene) {
          newScene = response.data.scene;
        } else if (response.data) {
          newScene = response.data;
        } else {
          // Fallback if response format is unexpected
          newScene = {
            ...formValues,
            id: `temp_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          console.warn(
            "SceneModalHandler - Unexpected API response format, using fallback:",
            newScene
          );
        }

        // Pass the scene data to the parent's onSuccess callback with actionType
        if (onSuccess) {
          console.log(
            "SceneModalHandler - Calling onSuccess with scene data:",
            newScene
          );
          onSuccess("create", newScene);
        } else {
          console.log("SceneModalHandler - No onSuccess callback provided");
        }
      } else if (modalType === "edit") {
        // For edit operations
        if (onSuccess) {
          console.log(
            "SceneModalHandler - Calling onSuccess callback for edit"
          );
          onSuccess("edit", formValues);
        } else {
          console.log("SceneModalHandler - No onSuccess callback provided");
        }
      } else {
        // For other operations like delete
        if (onSuccess) {
          console.log("SceneModalHandler - Calling onSuccess callback");
          onSuccess(modalType, formValues);
        } else {
          console.log("SceneModalHandler - No onSuccess callback provided");
        }
      }
    } catch (error) {
      console.error("SceneModalHandler - Error handling form result:", error);
    } finally {
      setLoading(false);
      console.log("SceneModalHandler - Closing modal");
      onClose();
    }
  };

  // Handler for cancel action
  const handleCancel = () => {
    console.log("SceneModalHandler - handleCancel called");
    onClose();
  };

  // Determine which component to render based on modalType
  const renderModalContent = () => {
    console.log("SceneModalHandler - renderModalContent for type:", modalType);

    switch (modalType) {
      case "create":
        return (
          <SceneForm
            universeId={universeId}
            onSubmit={handleFormResult}
            onCancel={handleCancel}
          />
        );
      case "edit":
        console.log(
          "SceneModalHandler - Rendering edit form with scene:",
          initialData?.id
        );
        return (
          <SceneForm
            universeId={universeId}
            sceneId={sceneId}
            initialData={initialData}
            onSubmit={handleFormResult}
            onCancel={handleCancel}
          />
        );
      case "delete":
        return (
          <SceneDeleteConfirmation
            scene={initialData}
            onConfirm={handleFormResult}
            onCancel={handleCancel}
          />
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
  modalType: PropTypes.oneOf(["create", "edit", "view", "delete"]).isRequired,
  universeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  sceneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  initialData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default SceneModalHandler;
