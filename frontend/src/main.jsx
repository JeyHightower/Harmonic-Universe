import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { UserOutlined } from './components/common/Icons';
import store from './store';
import './styles/global.css';
import './styles/variables.css';

// Add debug log
console.log('main.jsx is being loaded');

// Test importing an icon directly
try {
  console.log('Successfully imported UserOutlined icon:', UserOutlined);
} catch (error) {
  console.error('Error importing icon:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
