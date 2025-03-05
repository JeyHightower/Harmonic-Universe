import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/ensure-antd-version'; // Import the version utility first
import App from './App';
import { UserOutlined } from '@ant-design/icons';
import './styles/global.css';
import './styles/variables.css';
import './styles/modal-fix.css';

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
