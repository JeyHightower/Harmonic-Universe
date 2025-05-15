import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
  queue: [],
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, props = {} } = action.payload;

      // If already transitioning or open, queue the request
      if (state.isTransitioning || state.isOpen) {
        state.queue.push({ type, props, timestamp: Date.now() });
        return;
      }

      // Set the new modal
      state.isOpen = true;
      state.type = type;
      state.props = { ...props };
      state.isTransitioning = true;
    },

    openModalComplete: (state) => {
      state.isTransitioning = false;
    },

    closeModal: (state) => {
      state.isTransitioning = true;
    },

    closeModalComplete: (state) => {
      // Clear current modal state
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;

      // Process queue if there are modals waiting
      if (state.queue.length > 0) {
        const nextModal = state.queue.shift();
        state.isOpen = true;
        state.type = nextModal.type;
        state.props = { ...nextModal.props };
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

    clearQueue: (state) => {
      state.queue = [];
    },

    resetModalState: () => initialState,
  },
});

export const {
  openModal,
  openModalComplete,
  closeModal,
  closeModalComplete,
  updateModalProps,
  clearQueue,
  resetModalState,
} = modalSlice.actions;

// Selectors
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) => state.modal.isTransitioning;
export const selectModalQueue = (state) => state.modal.queue;

export default modalSlice.reducer;
