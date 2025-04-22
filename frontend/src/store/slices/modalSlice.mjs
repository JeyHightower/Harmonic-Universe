import { createSlice } from "@reduxjs/toolkit";
import { MODAL_CONFIG } from "../../utils";

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
  queue: [], // Queue for handling multiple modals
  history: [], // Track modal history for debugging
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, props = {} } = action.payload;

      // Add logs for debugging
      console.log('modalSlice: openModal called with type:', type, 'and props:', props);

      // Don't open if already transitioning
      if (state.isTransitioning) {
        console.log('modalSlice: Cannot open modal while transitioning, queueing instead');
        state.queue.push({ type, props });
        return;
      }

      // Log the current modal to history
      if (state.isOpen && state.type) {
        state.history.push({
          type: state.type,
          props: { ...state.props },
          timestamp: Date.now(),
        });
      }

      // Set the new modal
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

      console.log('modalSlice: Modal opened successfully');
    },
    closeModal: (state) => {
      console.log('modalSlice: closeModal called');

      if (!state.isTransitioning) {
        state.isTransitioning = true;
        console.log('modalSlice: Beginning modal close transition');
      }
    },
    closeModalComplete: (state) => {
      console.log('modalSlice: closeModalComplete called');

      // Clear current modal state
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;

      // If there are modals in the queue, open the next one
      if (state.queue.length > 0) {
        const nextModal = state.queue.shift();
        console.log('modalSlice: Opening next modal from queue:', nextModal.type);

        state.isOpen = true;
        state.type = nextModal.type;
        state.props = {
          size: nextModal.props.size || MODAL_CONFIG.SIZES.MEDIUM,
          position: nextModal.props.position || MODAL_CONFIG.POSITIONS.CENTER,
          animation: nextModal.props.animation || MODAL_CONFIG.ANIMATIONS.FADE,
          draggable: nextModal.props.draggable || MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
          closeOnEscape:
            nextModal.props.closeOnEscape ?? MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
          closeOnBackdrop:
            nextModal.props.closeOnBackdrop ??
            MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
          preventBodyScroll:
            nextModal.props.preventBodyScroll ??
            MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
          showCloseButton:
            nextModal.props.showCloseButton ??
            MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
          ...nextModal.props,
        };
        state.isTransitioning = true;
      } else {
        console.log('modalSlice: No more modals in queue');
      }
    },
    updateModalProps: (state, action) => {
      console.log('modalSlice: updateModalProps called with:', action.payload);

      if (!state.isTransitioning) {
        state.props = {
          ...state.props,
          ...action.payload,
        };
        console.log('modalSlice: Modal props updated successfully');
      } else {
        console.log('modalSlice: Cannot update props while transitioning');
      }
    },
    queueModal: (state, action) => {
      const { type, props = {} } = action.payload;
      console.log('modalSlice: queueModal called with type:', type);

      state.queue.push({ type, props });
      console.log('modalSlice: Modal added to queue, queue length:', state.queue.length);
    },
    clearQueue: (state) => {
      console.log('modalSlice: clearQueue called');
      state.queue = [];
    },
    clearHistory: (state) => {
      console.log('modalSlice: clearHistory called');
      state.history = [];
    },
    resetModalState: (state) => {
      console.log('modalSlice: resetModalState called, completely resetting modal state');
      // Reset everything to initial state
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;
      state.queue = [];
      // Optionally keep history for debugging
      // state.history = [];
    },
  },
});

export const {
  openModal,
  closeModal,
  closeModalComplete,
  updateModalProps,
  queueModal,
  clearQueue,
  clearHistory,
  resetModalState
} = modalSlice.actions;

// Selectors
export const selectModalState = (state) => state.modal;
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) =>
  state.modal.isTransitioning;
export const selectModalQueue = (state) => state.modal.queue;
export const selectModalHistory = (state) => state.modal.history;

export default modalSlice.reducer;
