import { createSlice } from "@reduxjs/toolkit";
import { MODAL_CONFIG } from "../../utils";

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, props = {} } = action.payload;

      // Don't open if already transitioning
      if (state.isTransitioning) {
        return;
      }

      state.isOpen = true;
      state.type = type;
      state.props = {
        size: props.size || MODAL_CONFIG.SIZES.MEDIUM,
        position: props.position || MODAL_CONFIG.POSITIONS.CENTER,
        animation: props.animation || MODAL_CONFIG.ANIMATIONS.FADE,
        draggable: props.draggable || MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
        closeOnEscape:
          props.closeOnEscape ?? MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
        closeOnBackdrop:
          props.closeOnBackdrop ??
          MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
        preventBodyScroll:
          props.preventBodyScroll ??
          MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
        showCloseButton:
          props.showCloseButton ??
          MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
        ...props,
      };
      state.isTransitioning = true;
    },
    closeModal: (state) => {
      if (!state.isTransitioning) {
        state.isTransitioning = true;
      }
    },
    closeModalComplete: (state) => {
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;
    },
    updateModalProps: (state, action) => {
      if (!state.isTransitioning) {
        state.props = {
          ...state.props,
          ...action.payload,
        };
      }
    },
  },
});

export const { openModal, closeModal, closeModalComplete, updateModalProps } =
  modalSlice.actions;

// Selectors
export const selectModalState = (state) => state.modal;
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) =>
  state.modal.isTransitioning;

export default modalSlice.reducer;
