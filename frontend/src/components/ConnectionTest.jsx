import React, { useEffect, useState } from 'react';
import api from '../services/api';

const ConnectionTest = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await api.get('/api/health');
        if (response.data.status === 'healthy') {
          setStatus('Connected to backend successfully!');
        } else {
          setStatus('Connected but received unexpected response');
        }
      } catch (err) {
        setError(err.message || 'Failed to connect to backend');
        setStatus('Connection failed');
      }
    };

    checkConnection();
  }, []);

  return (
    <div
      style={{
        padding: '20px',
        margin: '20px',
        borderRadius: '8px',
        backgroundColor: error ? '#fee' : '#efe',
        border: `1px solid ${error ? '#faa' : '#afa'}`,
      }}
    >
      <h3>Backend Connection Status</h3>
      <p>{status}</p>
      {error && <p style={{ color: '#d00' }}>Error: {error}</p>}
    </div>
  );
};

export default ConnectionTest;
