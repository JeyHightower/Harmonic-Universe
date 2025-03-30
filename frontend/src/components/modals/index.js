import ModalSystem from "./ModalSystem";
import DraggableModal from "./DraggableModal";

// Export the main modal component
export default ModalSystem;

// Export specific modal types for convenience
export const Modal = ModalSystem;
export { DraggableModal };
export const AlertModal = (props) => <ModalSystem {...props} type="alert" />;
export const ConfirmModal = (props) => (
  <ModalSystem {...props} type="confirm" />
);
export const FormModal = (props) => <ModalSystem {...props} type="form" />;
