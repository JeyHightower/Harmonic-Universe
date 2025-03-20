import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '4rem 2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Page Not Found</h2>

      <p style={{ marginBottom: '2rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>

      <Link to="/" style={{
        background: '#1890ff',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 'bold',
        display: 'inline-block'
      }}>
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;
