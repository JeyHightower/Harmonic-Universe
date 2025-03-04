import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserOutlined } from '@ant-design/icons';
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
    <App />
  </React.StrictMode>
);
