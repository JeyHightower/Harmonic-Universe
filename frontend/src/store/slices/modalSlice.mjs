import { createSlice } from '@reduxjs/toolkit';
import { MODAL_CONFIG } from '../../utils';

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
  queue: [], // Queue for handling multiple modals
  history: [], // Track modal history for debugging
  error: null, // Track errors in modal operations
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, props = {} } = action.payload;

      // Don't open if already transitioning
      if (state.isTransitioning) {
        // Queue the modal instead
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

      // Clear any error
      state.error = null;

      // Set the new modal
      state.isOpen = true;
      state.type = type;
      state.props = {
        size: props.size || MODAL_CONFIG.SIZES.MEDIUM,
        position: props.position || MODAL_CONFIG.POSITIONS.CENTER,
        animation: props.animation || MODAL_CONFIG.ANIMATIONS.FADE,
        draggable: props.draggable || MODAL_CONFIG.DEFAULT_SETTINGS.draggable,
        closeOnEscape: props.closeOnEscape ?? MODAL_CONFIG.DEFAULT_SETTINGS.closeOnEscape,
        closeOnBackdrop: props.closeOnBackdrop ?? MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
        preventBodyScroll:
          props.preventBodyScroll ?? MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
        showCloseButton: props.showCloseButton ?? MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
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
      // Clear current modal state
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;
      state.error = null;

      // If there are modals in the queue, open the next one
      if (state.queue.length > 0) {
        const nextModal = state.queue.shift();

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
            nextModal.props.closeOnBackdrop ?? MODAL_CONFIG.DEFAULT_SETTINGS.closeOnBackdrop,
          preventBodyScroll:
            nextModal.props.preventBodyScroll ?? MODAL_CONFIG.DEFAULT_SETTINGS.preventBodyScroll,
          showCloseButton:
            nextModal.props.showCloseButton ?? MODAL_CONFIG.DEFAULT_SETTINGS.showCloseButton,
          ...nextModal.props,
        };
        state.isTransitioning = true;
      }
    },
    updateModalProps: (state, action) => {
      if (!state.isTransitioning) {
        state.props = {
          ...state.props,
          ...action.payload,
        };
      }
    },
    queueModal: (state, action) => {
      const { type, props = {} } = action.payload;
      state.queue.push({ type, props });
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    clearHistory: (state) => {
      state.history = [];
    },
    setModalError: (state, action) => {
      state.error = action.payload;
    },
    resetModalState: (state) => {
      // Reset everything to initial state but keep history for debugging
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;
      state.queue = [];
      state.error = null;
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
  setModalError,
  resetModalState,
} = modalSlice.actions;

// Selectors
export const selectModalState = (state) => state.modal;
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) => state.modal.isTransitioning;
export const selectModalQueue = (state) => state.modal.queue;
export const selectModalHistory = (state) => state.modal.history;
export const selectModalError = (state) => state.modal.error;

export default modalSlice.reducer;
