import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  openModal,
  closeModal,
  closeModalComplete,
} from "../../store/slices/modalSlice";
import { MODAL_TYPES } from "../../constants/modalTypes";

const ModalTest = () => {
  const dispatch = useDispatch();

  // Set up event listeners for modal events
  useEffect(() => {
    const handleModalClose = () => {
      dispatch(closeModal());
      // Complete close after animation
      setTimeout(() => {
        dispatch(closeModalComplete());
      }, 300); // Match animation duration
    };

    const handleModalConfirm = (event) => {
      console.log("Modal confirmed:", event.detail);
      handleModalClose();
    };

    const handleModalCancel = (event) => {
      console.log("Modal cancelled:", event.detail);
      handleModalClose();
    };

    document.addEventListener("modal-close", handleModalClose);
    document.addEventListener("modal-confirm", handleModalConfirm);
    document.addEventListener("modal-cancel", handleModalCancel);

    return () => {
      document.removeEventListener("modal-close", handleModalClose);
      document.removeEventListener("modal-confirm", handleModalConfirm);
      document.removeEventListener("modal-cancel", handleModalCancel);
    };
  }, [dispatch]);

  const testLoginModal = () => {
    dispatch(
      openModal({
        type: MODAL_TYPES.LOGIN,
        props: {
          title: "Login",
          size: "medium",
          animation: "fade",
        },
      })
    );
  };

  const testConfirmationModal = () => {
    dispatch(
      openModal({
        type: MODAL_TYPES.CONFIRMATION,
        props: {
          title: "Test Confirmation",
          message: "Are you sure you want to proceed with this test?",
          confirmId: "test-confirm",
          cancelId: "test-cancel",
          confirmText: "Yes",
          cancelText: "No",
          size: "small",
          animation: "fade",
        },
      })
    );
  };

  const testAlertModal = () => {
    dispatch(
      openModal({
        type: MODAL_TYPES.ALERT,
        props: {
          title: "Test Alert",
          message: "This is a test alert modal!",
          severity: "info",
          size: "small",
          animation: "fade",
        },
      })
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Modal System Test</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={testLoginModal}>Test Login Modal</button>
        <button onClick={testConfirmationModal}>Test Confirmation Modal</button>
        <button onClick={testAlertModal}>Test Alert Modal</button>
      </div>
    </div>
  );
};

export default ModalTest;
