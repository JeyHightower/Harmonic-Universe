import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import authReducer from '../store/slices/authSlice';
import mediaEffectReducer from '../store/slices/mediaEffectSlice';
import sceneReducer from '../store/slices/sceneSlice';
import storyboardReducer from '../store/slices/storyboardSlice';
import uiReducer from '../store/slices/uiSlice';
import universeReducer from '../store/slices/universeSlice';
import theme from '../theme';

function render(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        universe: universeReducer,
        storyboard: storyboardReducer,
        scene: sceneReducer,
        mediaEffect: mediaEffectReducer,
        ui: uiReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';
// override render method
export { render };

