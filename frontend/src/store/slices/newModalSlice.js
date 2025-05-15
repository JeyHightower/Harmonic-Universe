import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
  queue: [],
  // Add interaction fixes state for modals
  interactionFixes: {
    applied: false,
    lastApplied: null,
    pointer: {
      enabled: true,
      fixed: false,
    },
    zIndex: {
      baseModal: 1050,
      baseContent: 1055,
      baseForm: 1060,
      baseInputs: 1065,
    },
    eventPropagation: {
      stopPropagation: true,
      preventBackdropClose: false,
    },
    portalStatus: {
      ready: false,
      initialized: false,
    },
    debug: {
      enabled: false,
      elements: [],
      errors: [],
    },
  },
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

    // Add new action to apply modal interaction fixes
    applyInteractionFixes: (state, action) => {
      state.interactionFixes.applied = true;
      state.interactionFixes.lastApplied = Date.now();

      // Apply any custom fix settings if provided
      if (action.payload) {
        if (action.payload.zIndex) {
          state.interactionFixes.zIndex = {
            ...state.interactionFixes.zIndex,
            ...action.payload.zIndex,
          };
        }

        if (action.payload.pointer) {
          state.interactionFixes.pointer = {
            ...state.interactionFixes.pointer,
            ...action.payload.pointer,
          };
        }
      }
    },
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
  applyInteractionFixes,
} = modalSlice.actions;

// Selectors
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) => state.modal.isTransitioning;
export const selectModalQueue = (state) => state.modal.queue;

// Add new selectors for interaction fixes
export const selectInteractionFixes = (state) => state.modal.interactionFixes;
export const selectInteractionFixesApplied = (state) => state.modal.interactionFixes.applied;
export const selectModalZIndexLevels = (state) => state.modal.interactionFixes.zIndex;

export default modalSlice.reducer;
