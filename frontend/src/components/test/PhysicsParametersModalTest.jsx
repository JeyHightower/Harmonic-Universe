import { App as AntApp } from 'antd';
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useModal } from '../../contexts/ModalContext';
import PhysicsParametersModal from '../../features/physicsParameters/PhysicsParametersModal';
import store from '../../store';
import { createPhysicsParametersModal } from '../../utils/modalHelpers';

/**
 * Test component for PhysicsParametersModal
 * This component allows manual testing of the PhysicsParametersModal
 * after it was updated to use Modal.jsx instead of BaseModal.jsx
 */
const PhysicsParametersModalTest = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useModal();

  // Sample universe ID for testing
  const testUniverseId = '123e4567-e89b-12d3-a456-426614174000';

  // Sample initial data for testing edit mode
  const sampleInitialData = {
    id: '987e6543-e21b-12d3-a456-426614174000',
    name: 'Test Physics Parameters',
    description: 'This is a test description',
    gravity: 10.5,
    time_scale: 1.2,
    air_resistance: 0.3,
    collision_elasticity: 0.8,
    friction_coefficient: 0.4,
    integration_method: 'euler',
    constraint_iterations: 12,
  };

  const handleOpenModal = () => {
    console.log('Opening direct modal');
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleOpenGlobalModal = () => {
    console.log('Opening global modal');
    openModal(createPhysicsParametersModal(testUniverseId, sampleInitialData));
  };

  return (
    <Provider store={store}>
      <AntApp>
        <div
          className="test-container"
          style={{
            padding: '20px',
            backgroundColor: '#f0f8ff',
            border: '2px solid #3498db',
            borderRadius: '8px',
            margin: '20px',
          }}
        >
          <h1
            style={{ color: '#2c3e50', fontSize: '28px', marginBottom: '20px' }}
          >
            Physics Parameters Modal Test
          </h1>

          <div
            className="test-buttons"
            style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}
          >
            <Button
              onClick={handleOpenModal}
              variant="primary"
              style={{
                fontSize: '18px',
                padding: '12px 24px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Open Direct Modal
            </Button>

            <Button
              onClick={handleOpenGlobalModal}
              variant="secondary"
              style={{
                fontSize: '18px',
                padding: '12px 24px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Open Global Modal
            </Button>
          </div>

          <div
            className="test-info"
            style={{
              backgroundColor: '#ecf0f1',
              padding: '15px',
              borderRadius: '4px',
            }}
          >
            <p>
              This test component demonstrates two ways to use the
              PhysicsParametersModal:
            </p>
            <ol style={{ marginLeft: '20px' }}>
              <li>
                <strong>Direct Modal:</strong> Renders the modal directly in
                this component
              </li>
              <li>
                <strong>Global Modal:</strong> Uses the global modal system via
                ModalContext
              </li>
            </ol>
            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
              Test the following functionality:
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li>Both modal types open and close properly</li>
              <li>Form validation works in both cases</li>
              <li>All form elements render correctly</li>
              <li>The modals are responsive at different screen sizes</li>
            </ul>
          </div>

          <Modal
            isOpen={isOpen}
            onClose={handleCloseModal}
            title="Physics Parameters Modal Test"
            size="medium"
          >
            <PhysicsParametersModal
              universeId={testUniverseId}
              initialData={sampleInitialData}
              testMode={true}
              onClose={handleCloseModal}
            />
          </Modal>
        </div>
      </AntApp>
    </Provider>
  );
};

export default PhysicsParametersModalTest;
