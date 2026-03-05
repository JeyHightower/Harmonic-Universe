import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';

import App from './App.tsx'
import { TestConnection } from './components/TestComponent.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
    <App />
    <TestConnection />
    </Provider>
  </StrictMode>,
)
