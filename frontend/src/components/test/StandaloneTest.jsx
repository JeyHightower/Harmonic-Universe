import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes';

const StandaloneTest = () => {
  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: '#000000',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1 style={{ fontSize: '48px', color: 'yellow', marginBottom: '40px' }}>
        STANDALONE TEST PAGE
      </h1>

      <div
        style={{
          backgroundColor: '#333333',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '800px',
          marginBottom: '40px',
        }}
      >
        <h2 style={{ color: 'limegreen', marginBottom: '20px' }}>
          This page renders outside of the Layout component
        </h2>

        <p
          style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '20px' }}
        >
          If you can see this page, the routing system is working correctly.
          This page does not use the Layout component, which means if routing is
          working properly, you should not see the header or footer.
        </p>

        <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
          Timestamp: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '300px',
        }}
      >
        <Link
          to={ROUTES.HOME}
          style={{
            padding: '15px 20px',
            backgroundColor: 'blue',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Go Home
        </Link>

        <Link
          to={ROUTES.SIMPLE_MODAL_TEST}
          style={{
            padding: '15px 20px',
            backgroundColor: 'red',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Go to Modal Test
        </Link>

        <button
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '15px 20px',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Test Button Click
        </button>
      </div>
    </div>
  );
};

export default StandaloneTest;
