import { closeModalComplete, openModalComplete } from '../slices/newModalSlice';

// Define standard transition duration
const TRANSITION_DURATION = 200; // ms

// Define a middleware to handle modal transitions
const modalMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Handle opening transitions
  if (action.type === 'modal/openModal') {
    setTimeout(() => {
      store.dispatch(openModalComplete());
    }, TRANSITION_DURATION);
  }

  // Handle closing transitions
  if (action.type === 'modal/closeModal') {
    setTimeout(() => {
      store.dispatch(closeModalComplete());
    }, TRANSITION_DURATION);
  }

  return result;
};

export default modalMiddleware;
