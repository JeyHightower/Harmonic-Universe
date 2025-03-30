import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useModal from "../../hooks/useModal.js";
import { selectModalProps } from "../../store/modalSlice.js";
import { getModalComponent } from "../ModalUtils.jsx";
import { ModalSystem } from "./ModalSystem";

const GlobalModal = () => {
  const modalProps = useSelector(selectModalProps);
  const { closeModal } = useModal();
  const portalRootRef = useRef(null);

  // One-time portal root setup
  useEffect(() => {
    // Check for portal-root from index.html first
    let portalRoot = document.getElementById("portal-root");

    // Create modal root if it doesn't exist (fallback)
    if (!portalRoot) {
      console.debug("Creating portal-root element");
      portalRoot = document.createElement("div");
      portalRoot.id = "portal-root";
      document.body.appendChild(portalRoot);
      portalRootRef.current = portalRoot;
    } else {
      console.debug("Using existing portal-root element");
      portalRootRef.current = portalRoot;
    }

    return () => {
      // Don't remove the portal-root if it was in the original HTML
      // Only clean up dynamically created elements
      if (portalRootRef.current) {
        const wasAddedDynamically = !document.querySelector(
          "html > body > #portal-root"
        );
        if (wasAddedDynamically && !portalRootRef.current.hasChildNodes()) {
          console.debug("Removing dynamically created portal-root");
          document.body.removeChild(portalRootRef.current);
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Add console log to debug modal state
  useEffect(() => {
    console.debug("Modal state changed:", {
      hasProps: !!modalProps,
    });
  }, [modalProps]);

  if (!modalProps) return null;

  // If a specific modal component is requested, use it
  if (modalProps.type) {
    const ModalComponent = getModalComponent(modalProps.type);
    if (ModalComponent) {
      return <ModalComponent {...modalProps} onClose={closeModal} />;
    }
  }

  // Otherwise, use the ModalSystem
  return <ModalSystem {...modalProps} onClose={closeModal} />;
};

export default GlobalModal;
