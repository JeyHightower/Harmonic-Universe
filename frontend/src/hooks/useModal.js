import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  closeModal as closeModalAction,
  openModal as openModalAction,
} from "../store/modalSlice";
import { isValidModalType } from "../utils/modalRegistry";

/**
 * Custom hook for interacting with the modal system
 * @returns {Object} Modal functions and state
 */
const useModal = () => {
  const dispatch = useDispatch();

  const openModal = useCallback(
    (props) => {
      if (!props) {
        console.error("Modal props are required");
        return;
      }

      // If type is provided, validate it
      if (props.type && !isValidModalType(props.type)) {
        console.warn(`Unknown modal type: ${props.type}`);
      }

      dispatch(openModalAction(props));
    },
    [dispatch]
  );

  const closeModal = useCallback(() => {
    dispatch(closeModalAction());
  }, [dispatch]);

  return {
    openModal,
    closeModal,
  };
};

export default useModal;
