import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { ModalProvider } from './components/common/Modal';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';
import store from './store';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <ModalProvider>
            <AppRoutes />
          </ModalProvider>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
