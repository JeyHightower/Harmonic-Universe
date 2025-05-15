import { closeModalComplete, processQueuedModal } from '../slices/modalSlice.mjs';

// Define a middleware to handle modal queue processing
const modalMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // After modal close is completed, check if we have a queued modal
  if (action.type === closeModalComplete.type) {
    const state = store.getState();

    if (state.modal.processingQueue && state.modal.nextModal) {
      // Process the queued modal after a short delay
      setTimeout(() => {
        store.dispatch(processQueuedModal());
      }, 100); // Small delay to ensure clean transition
    }
  }

  return result;
};

export default modalMiddleware;
