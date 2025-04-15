import React, { useEffect, useRef, useState } from "react";
import Button from "../../../components/common/Button";
import { useModal } from "../../../contexts/ModalContext";
import { MODAL_TYPES } from "../../../constants/modalTypes";
import "../styles/Universe.css";

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedUniverse = null;
let currentOnCloseFn = null;

const UniverseInfoModal = ({ universe, onClose, isGlobalModal = true }) => {
  const { openModalByType } = useModal();
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  const universeRef = useRef(universe);

  console.log("UniverseInfoModal rendering with universe:", universe);
  console.log("Global modalVisible:", modalVisible);
  console.log("Global savedUniverse:", savedUniverse);

  // Update refs when props change
  useEffect(() => {
    universeRef.current = universe;
    onCloseRef.current = onClose;
  }, [universe, onClose]);

  // Set up visibility
  useEffect(() => {
    console.log("UniverseInfoModal useEffect running with universe:", universe);

    // Save the universe data and close function globally to persist across mounts
    if (universe) {
      savedUniverse = universe;
      currentOnCloseFn = onClose;
      modalVisible = true;
      console.log("Setting modalVisible to true");
    }

    // Set local state
    setVisible(true);

    // Clean up function
    return () => {
      console.log("UniverseInfoModal cleanup function running");
      // Don't reset the global state on unmount - that's the key to our fix
    };
  }, [universe, onClose]);

  // Function to safely close the modal
  const handleModalClose = () => {
    console.log("handleModalClose called");
    modalVisible = false;
    savedUniverse = null;

    // Call the original onClose
    if (currentOnCloseFn) {
      currentOnCloseFn();
      currentOnCloseFn = null;
    }
  };

  // If we have saved universe data but no current universe, use the saved one
  const displayUniverse = universe || savedUniverse;

  // Only render when we have universe data
  if (!displayUniverse || !modalVisible) {
    console.log(
      "UniverseInfoModal returning null - no displayUniverse or not visible"
    );
    return null;
  }

  console.log("UniverseInfoModal rendering content");

  // Check if user has permission to modify this universe
  const canModifyUniverse = displayUniverse?.user_role === "owner";

  const handleEdit = () => {
    if (!canModifyUniverse) return;

    // Close this modal and open the edit modal
    handleModalClose();

    openModalByType(MODAL_TYPES.UNIVERSE_EDIT, {
      universeId: displayUniverse.id,
      initialData: displayUniverse,
    });
  };

  return (
    <div
      className="universe-info-modal-backdrop"
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
        className="universe-info-modal"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          pointerEvents: "auto",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="universe-info-section">
          <h3>Basic Information</h3>
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{displayUniverse.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Description:</span>
            <span className="info-value">{displayUniverse.description}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Visibility:</span>
            <span className="info-value">
              {displayUniverse.is_public ? "Public" : "Private"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {new Date(displayUniverse.created_at).toLocaleString()}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">
              {new Date(displayUniverse.updated_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="universe-info-section">
          <h3>Statistics</h3>
          <div className="info-row">
            <span className="info-label">Physics Objects:</span>
            <span className="info-value">
              {displayUniverse.physics_objects_count || "N/A"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Scenes:</span>
            <span className="info-value">
              {displayUniverse.scenes_count || "N/A"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Simulations Run:</span>
            <span className="info-value">
              {displayUniverse.simulations_count || "N/A"}
            </span>
          </div>
        </div>

        <div className="universe-info-section">
          <h3>Physics Parameters</h3>
          {displayUniverse.physics_params ? (
            Object.entries(displayUniverse.physics_params).map(
              ([key, value]) => (
                <div className="info-row" key={key}>
                  <span className="info-label">
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    :
                  </span>
                  <span className="info-value">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              )
            )
          ) : (
            <div className="info-row">
              <span className="info-value">No physics parameters defined</span>
            </div>
          )}
        </div>

        <div className="universe-info-section">
          <h3>Harmony Parameters</h3>
          {displayUniverse.harmony_params ? (
            Object.entries(displayUniverse.harmony_params).map(
              ([key, value]) => (
                <div className="info-row" key={key}>
                  <span className="info-label">
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    :
                  </span>
                  <span className="info-value">{String(value)}</span>
                </div>
              )
            )
          ) : (
            <div className="info-row">
              <span className="info-value">No harmony parameters defined</span>
            </div>
          )}
        </div>

        {/* Add modal footer with buttons */}
        <div
          className="modal-footer"
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button onClick={handleModalClose}>Close</Button>
          {canModifyUniverse && (
            <Button onClick={handleEdit} variant="primary">
              Edit Universe
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniverseInfoModal; 