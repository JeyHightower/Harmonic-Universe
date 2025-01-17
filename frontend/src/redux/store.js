import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import rootReducer from './rootReducer';

// Environment check
const isDevelopment = import.meta.env.MODE === 'development';

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'physics/updateParticleState',
          'storyboard/setSelectedStoryboard',
          'universe/setCurrentUniverse',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'payload.content',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'physics.particles',
          'storyboard.selectedStoryboard',
          'universe.currentUniverse',
        ],
      },
      immutableCheck: { warnAfter: 300 },
      thunk: {
        extraArgument: {
          // Add any extra arguments for thunks here
        },
      },
    }),
  devTools: isDevelopment,
  preloadedState: undefined,
  enhancers: defaultEnhancers => [...defaultEnhancers],
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

// Enable hot reloading in development
if (isDevelopment && import.meta.hot) {
  import.meta.hot.accept('./rootReducer', async () => {
    const { default: newRootReducer } = await import('./rootReducer');
    store.replaceReducer(newRootReducer);
  });
}

export default store;
