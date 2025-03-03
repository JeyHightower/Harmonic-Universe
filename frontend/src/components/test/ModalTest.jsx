import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';

/**
 * A simple standalone modal test component
 */
const ModalTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [mountTime, setMountTime] = useState('');

  useEffect(() => {
    console.log('ModalTest component mounted');
    setMountTime(new Date().toLocaleTimeString());

    // Remove render count increment from useEffect
    // This might be contributing to re-render cycles

    return () => {
      console.log('ModalTest component unmounted');
    };
  }, []);

  const openModal = () => {
    console.log('Opening modal - click detected');
    alert('Button clicked!');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
  };

  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: '#f8d7da',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1 style={{ fontSize: '36px', color: '#721c24', marginBottom: '40px' }}>
        ⚠️ MODAL TESTING PAGE ⚠️
      </h1>

      <div
        style={{
          backgroundColor: '#fff3cd',
          padding: '20px',
          marginBottom: '30px',
          border: '2px solid #ffeeba',
          borderRadius: '8px',
          width: '80%',
          maxWidth: '600px',
        }}
      >
        <h3>Debug Information:</h3>
        <ul>
          <li>
            <strong>Mounted at:</strong> {mountTime}
          </li>
          <li>
            <strong>Render count:</strong> {renderCount}
          </li>
          <li>
            <strong>Current time:</strong> {new Date().toLocaleTimeString()}
          </li>
          <li>
            <strong>Modal state:</strong> {isModalOpen ? 'Open' : 'Closed'}
          </li>
        </ul>
        <p>Check browser console for additional logs.</p>
      </div>

      <p
        style={{
          fontSize: '20px',
          marginBottom: '30px',
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        This is a simple test page for the Modal component. Click the button
        below to open a test modal.
      </p>

      <button
        onClick={openModal}
        style={{
          fontSize: '24px',
          padding: '20px 40px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          marginBottom: '20px',
        }}
      >
        OPEN TEST MODAL
      </button>

      <button
        onClick={() => setRenderCount(prev => prev + 1)}
        style={{
          fontSize: '16px',
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        }}
      >
        Increment Render Count
      </button>

      {/* The modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Test Modal"
        size="medium"
      >
        <div style={{ padding: '20px' }}>
          <h2>Modal Content</h2>
          <p>This is a test modal to verify the modal component is working.</p>
          <p>You should be able to:</p>
          <ul>
            <li>See this modal content</li>
            <li>Close it by clicking the X button</li>
            <li>Close it by clicking outside</li>
            <li>Close it by pressing ESC key</li>
          </ul>
          <div
            style={{
              marginTop: '30px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={closeModal}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close Modal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModalTest;
