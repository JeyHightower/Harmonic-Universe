import React, { useState } from "react";
import { useModal } from "../../contexts/ModalContext";
import {
  createAlertModal,
  createConfirmModal,
  createFormModal,
} from "../../utils/modalHelpers";
import { Button } from "../common";
import Input from "../common/Input";
import { DraggableModal } from "./";
import "./ModalExample.css";

// Example form component for the form modal
const ExampleForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <>
      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        label="Message"
        name="message"
        type="textarea"
        value={formData.message}
        onChange={handleChange}
        required
      />
    </>
  );
};

const ModalExample = () => {
  const { openModal } = useModal();
  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggableModalOpen, setIsDraggableModalOpen] = useState(false);

  // Alert modal example
  const handleOpenAlertModal = () => {
    console.log("Opening alert modal");
    openModal(
      createAlertModal(
        "This is an alert message to inform the user about something important.",
        { title: "Information" }
      )
    );
  };

  // Confirmation modal examples
  const handleOpenConfirmModal = () => {
    openModal(
      createConfirmModal(
        "Are you sure you want to proceed with this action?",
        () => {
          openModal(
            createAlertModal("Action confirmed successfully!", {
              title: "Success",
              animation: "zoom",
            })
          );
        },
        {
          title: "Please Confirm",
          confirmText: "Yes, Proceed",
          cancelText: "Cancel",
        }
      )
    );
  };

  const handleOpenDeleteConfirmModal = () => {
    openModal(
      createConfirmModal(
        "Are you sure you want to delete this item? This action cannot be undone.",
        () => {
          openModal(
            createAlertModal("Item deleted successfully!", {
              title: "Deleted",
              animation: "zoom",
              type: "alert",
            })
          );
        },
        {
          title: "Delete Item",
          confirmText: "Delete",
          cancelText: "Cancel",
          isDestructive: true,
          animation: "slide",
        }
      )
    );
  };

  // Form modal example
  const handleOpenFormModal = () => {
    const handleSubmit = async (data) => {
      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmittedData(data);
      setIsSubmitting(false);

      // Close the form modal
      openModal(
        createAlertModal(
          `Form submitted successfully with name: ${data.name}, email: ${data.email}`,
          { title: "Form Submitted" }
        )
      );
    };

    openModal(
      createFormModal(
        ExampleForm,
        {
          onSubmit: handleSubmit,
          isSubmitting,
        },
        {
          title: "Contact Form",
          submitText: "Submit Form",
          cancelText: "Cancel",
          size: "medium",
          position: "center",
        }
      )
    );
  };

  // Size variant examples
  const handleOpenSmallModal = () => {
    openModal(
      createAlertModal("This is a small modal", {
        title: "Small Modal",
        size: "small",
      })
    );
  };

  const handleOpenMediumModal = () => {
    openModal(
      createAlertModal("This is a medium modal (default size)", {
        title: "Medium Modal",
        size: "medium",
      })
    );
  };

  const handleOpenLargeModal = () => {
    openModal(
      createAlertModal("This is a large modal for displaying more content", {
        title: "Large Modal",
        size: "large",
      })
    );
  };

  const handleOpenFullModal = () => {
    openModal(
      createAlertModal(
        "This is a full-sized modal that takes up most of the screen",
        {
          title: "Full Modal",
          size: "full",
        }
      )
    );
  };

  // Animation variant examples
  const handleOpenFadeModal = () => {
    openModal(
      createAlertModal("This modal uses a fade animation (default)", {
        title: "Fade Animation",
        animation: "fade",
      })
    );
  };

  const handleOpenSlideModal = () => {
    openModal(
      createAlertModal("This modal uses a slide animation", {
        title: "Slide Animation",
        animation: "slide",
      })
    );
  };

  const handleOpenZoomModal = () => {
    openModal(
      createAlertModal("This modal uses a zoom animation", {
        title: "Zoom Animation",
        animation: "zoom",
      })
    );
  };

  // Position variant examples
  const handleOpenTopModal = () => {
    openModal(
      createAlertModal("This modal appears at the top of the screen", {
        title: "Top Position",
        position: "top",
      })
    );
  };

  const handleOpenCenterModal = () => {
    openModal(
      createAlertModal(
        "This modal appears in the center of the screen (default)",
        {
          title: "Center Position",
          position: "center",
        }
      )
    );
  };

  const handleOpenBottomModal = () => {
    openModal(
      createAlertModal("This modal appears at the bottom of the screen", {
        title: "Bottom Position",
        position: "bottom",
      })
    );
  };

  // Stacked modals example
  const handleOpenStackedModals = () => {
    openModal(
      createAlertModal("This is the first modal", {
        title: "Modal 1",
        animation: "fade",
        footerContent: (
          <Button
            onClick={() => {
              openModal(
                createAlertModal("This is the second modal stacked on top", {
                  title: "Modal 2",
                  animation: "slide",
                  footerContent: (
                    <Button
                      onClick={() => {
                        openModal(
                          createAlertModal(
                            "This is the third modal stacked on top",
                            {
                              title: "Modal 3",
                              animation: "zoom",
                            }
                          )
                        );
                      }}
                    >
                      Open Third Modal
                    </Button>
                  ),
                })
              );
            }}
          >
            Open Second Modal
          </Button>
        ),
      })
    );
  };

  // Draggable modal example
  const handleOpenDraggableModal = () => {
    setIsDraggableModalOpen(true);
  };

  const handleCloseDraggableModal = () => {
    setIsDraggableModalOpen(false);
  };

  return (
    <div className="modal-examples">
      <h1>Modal System Examples</h1>
      <p className="intro">
        Harmonic Universe provides a powerful and flexible modal system for
        displaying alerts, confirmations, forms, and custom content. Explore the
        examples below to see what's possible.
      </p>

      <section className="examples-section">
        <h2>Modal Types</h2>
        <p className="description">
          The modal system supports various types of modals for different use
          cases, including alert messages, confirmation dialogs, and forms.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenAlertModal}>Alert Modal</Button>
          <Button onClick={handleOpenConfirmModal}>Confirm Modal</Button>
          <Button onClick={handleOpenDeleteConfirmModal}>
            Delete Confirm Modal
          </Button>
          <Button onClick={handleOpenFormModal}>Form Modal</Button>
        </div>
      </section>

      <section className="examples-section">
        <h2>Modal Sizes</h2>
        <p className="description">
          Modals come in different sizes to accommodate various amounts of
          content, from simple messages to complex forms.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenSmallModal}>Small Modal</Button>
          <Button onClick={handleOpenMediumModal}>Medium Modal</Button>
          <Button onClick={handleOpenLargeModal}>Large Modal</Button>
          <Button onClick={handleOpenFullModal}>Full Modal</Button>
        </div>
      </section>

      <section className="examples-section">
        <h2>Modal Animations</h2>
        <p className="description">
          Choose from different animation styles to provide visual feedback when
          opening and closing modals.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenFadeModal}>Fade Animation</Button>
          <Button onClick={handleOpenSlideModal}>Slide Animation</Button>
          <Button onClick={handleOpenZoomModal}>Zoom Animation</Button>
        </div>
      </section>

      <section className="examples-section">
        <h2>Modal Positions</h2>
        <p className="description">
          Position your modals at the top, center, or bottom of the screen based
          on your UX requirements.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenTopModal}>Top Position</Button>
          <Button onClick={handleOpenCenterModal}>Center Position</Button>
          <Button onClick={handleOpenBottomModal}>Bottom Position</Button>
        </div>
      </section>

      <section className="examples-section">
        <h2>Stacked Modals</h2>
        <p className="description">
          The modal system supports opening multiple modals on top of each
          other, maintaining proper focus management and z-index stacking.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenStackedModals}>Open Stacked Modals</Button>
        </div>
      </section>

      <section className="examples-section">
        <h2>Draggable Modal</h2>
        <p className="description">
          Draggable modals can be moved around the screen by clicking and
          dragging the modal header. This is useful for comparing information
          between a modal and the content behind it.
        </p>
        <div className="button-group">
          <Button onClick={handleOpenDraggableModal}>
            Open Draggable Modal
          </Button>
        </div>
      </section>

      {submittedData && (
        <section className="examples-section submission-data">
          <h2>Last Form Submission</h2>
          <h3>Received Data:</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </section>
      )}

      {/* Draggable Modal */}
      <DraggableModal
        isOpen={isDraggableModalOpen}
        onClose={handleCloseDraggableModal}
        title="Draggable Modal"
        size="medium"
      >
        <div className="draggable-content">
          <p>
            This modal can be moved by clicking and dragging its header. Try it
            now!
          </p>
          <p>
            Draggable modals are useful when you need to compare information or
            interact with content behind the modal.
          </p>
          <div
            className="modal-actions"
            style={{ marginTop: "20px", textAlign: "right" }}
          >
            <Button onClick={handleCloseDraggableModal}>Close</Button>
          </div>
        </div>
      </DraggableModal>
    </div>
  );
};

export default ModalExample;
