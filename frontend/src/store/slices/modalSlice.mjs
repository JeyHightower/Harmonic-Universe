import { createSlice } from '@reduxjs/toolkit';
import { MODAL_CONFIG } from '../../utils';

const initialState = {
  isOpen: false,
  type: null,
  props: {},
  isTransitioning: false,
  lastUpdateTime: null,
  queue: [], // Queue for handling multiple modals
  history: [], // Track modal history for debugging
  error: null, // Track errors in modal operations

  // New state for modal interaction fixes
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
      const currentTime = Date.now();

      // If already transitioning or open, queue the request instead of showing a warning
      if (state.isTransitioning || (state.isOpen && state.type)) {
        console.log(`Modal system busy, queueing modal: ${type}`);
        // Queue the modal instead of trying to open immediately
        state.queue.push({ type, props, timestamp: currentTime });
        return;
      }

      // Log the current modal to history
      if (state.isOpen && state.type) {
        state.history.push({
          type: state.type,
          props: { ...state.props },
          timestamp: currentTime,
        });
      }

      // Clear any error
      state.error = null;

      // Set the new modal
      state.isOpen = true;
      state.type = type;
      state.lastUpdateTime = currentTime;
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

      // Reset interaction fixes status on each modal open
      state.interactionFixes.applied = false;
      state.interactionFixes.debug.errors = [];
    },
    closeModal: (state) => {
      if (!state.isTransitioning) {
        state.isTransitioning = true;
        state.lastUpdateTime = Date.now();
      }
    },
    closeModalComplete: (state) => {
      // Clear current modal state
      state.isOpen = false;
      state.type = null;
      state.props = {};
      state.isTransitioning = false;
      state.lastUpdateTime = Date.now();
      state.error = null;

      // If there are modals in the queue, mark the next one ready
      if (state.queue.length > 0) {
        const nextModal = state.queue.shift();

        // Instead of immediately opening, set a processingQueue flag
        // This will be handled by the middleware or component
        state.processingQueue = true;
        state.nextModal = {
          type: nextModal.type,
          props: {
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
          },
          timestamp: Date.now(),
        };
      }
    },
    updateModalProps: (state, action) => {
      if (!state.isTransitioning) {
        state.props = {
          ...state.props,
          ...action.payload,
        };
        state.lastUpdateTime = Date.now();
      }
    },
    queueModal: (state, action) => {
      const { type, props = {} } = action.payload;
      state.queue.push({ type, props, timestamp: Date.now() });
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
      state.lastUpdateTime = Date.now();
      state.queue = [];
      state.error = null;
    },

    // New reducers for modal interaction fixes
    initializeModalPortal: (state, action) => {
      state.interactionFixes.portalStatus.initialized = true;
      state.interactionFixes.portalStatus.ready = action.payload?.success || false;
    },

    applyInteractionFixes: (state, action) => {
      const { success, elements, timestamp } = action.payload || {};
      state.interactionFixes.applied = success || false;
      state.interactionFixes.lastApplied = timestamp || Date.now();
      if (elements) {
        state.interactionFixes.debug.elements = elements;
      }
    },

    setPointerEventsEnabled: (state, action) => {
      state.interactionFixes.pointer.enabled = action.payload;
    },

    setPointerEventsFixed: (state, action) => {
      state.interactionFixes.pointer.fixed = action.payload;
    },

    updateZIndexLevels: (state, action) => {
      state.interactionFixes.zIndex = {
        ...state.interactionFixes.zIndex,
        ...action.payload,
      };
    },

    setEventPropagation: (state, action) => {
      state.interactionFixes.eventPropagation = {
        ...state.interactionFixes.eventPropagation,
        ...action.payload,
      };
    },

    setDebugMode: (state, action) => {
      state.interactionFixes.debug.enabled = action.payload;
    },

    addDebugError: (state, action) => {
      state.interactionFixes.debug.errors.push({
        message: action.payload,
        timestamp: Date.now(),
      });
    },

    clearDebugErrors: (state) => {
      state.interactionFixes.debug.errors = [];
    },

    // Add new action to process the queue
    processQueuedModal: (state) => {
      if (state.processingQueue && state.nextModal) {
        state.isOpen = true;
        state.type = state.nextModal.type;
        state.props = state.nextModal.props;
        state.isTransitioning = true;
        state.lastUpdateTime = Date.now();

        // Clear the queue processing flags
        state.processingQueue = false;
        state.nextModal = null;
      }
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
  processQueuedModal,

  // Export new interaction fixes actions
  initializeModalPortal,
  applyInteractionFixes,
  setPointerEventsEnabled,
  setPointerEventsFixed,
  updateZIndexLevels,
  setEventPropagation,
  setDebugMode,
  addDebugError,
  clearDebugErrors,
} = modalSlice.actions;

// Selectors
export const selectIsModalOpen = (state) => state.modal.isOpen;
export const selectModalType = (state) => state.modal.type;
export const selectModalProps = (state) => state.modal.props;
export const selectIsModalTransitioning = (state) => state.modal.isTransitioning;
export const selectModalQueue = (state) => state.modal.queue;
export const selectModalHistory = (state) => state.modal.history;
export const selectModalError = (state) => state.modal.error;

// New selectors for interaction fixes
export const selectModalState = (state) => state.modal;
export const selectInteractionFixes = (state) => state.modal.interactionFixes;
export const selectInteractionFixesApplied = (state) => state.modal.interactionFixes.applied;
export const selectModalZIndexLevels = (state) => state.modal.interactionFixes.zIndex;
export const selectModalPointerEvents = (state) => state.modal.interactionFixes.pointer;
export const selectModalDebugState = (state) => state.modal.interactionFixes.debug;

export default modalSlice.reducer;
