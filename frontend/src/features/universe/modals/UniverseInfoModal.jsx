import { useEffect, useRef, useState } from 'react';
import Button from '../../../components/common/Button.jsx';
import { MODAL_TYPES } from '../../../constants/modalTypes';
import { useModalState } from '../../../hooks/useModalState';
import '../styles/Universe.css';

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedUniverse = null;
let currentOnCloseFn = null;

const UniverseInfoModal = ({ universe, onClose, isGlobalModal = true }) => {
  const { open } = useModalState();
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  const universeRef = useRef(universe);

  console.log('UniverseInfoModal rendering with universe:', universe);
  console.log('Global modalVisible:', modalVisible);
  console.log('Global savedUniverse:', savedUniverse);

  // Update refs when props change
  useEffect(() => {
    universeRef.current = universe;
    onCloseRef.current = onClose;
  }, [universe, onClose]);

  // Set up visibility
  useEffect(() => {
    console.log('UniverseInfoModal useEffect running with universe:', universe);

    // Save the universe data and close function globally to persist across mounts
    if (universe) {
      savedUniverse = universe;
      currentOnCloseFn = onClose;
      modalVisible = true;
      console.log('Setting modalVisible to true');
    }

    // Set local state
    setVisible(true);

    // Clean up function
    return () => {
      console.log('UniverseInfoModal cleanup function running');
      // Don't reset the global state on unmount - that's the key to our fix
    };
  }, [universe, onClose]);

  // Function to safely close the modal
  const handleModalClose = () => {
    console.log('handleModalClose called');
    modalVisible = false;
    savedUniverse = null;

    // Call the original onClose
    if (currentOnCloseFn) {
      currentOnCloseFn();
      currentOnCloseFn = null;
    }
  };

  // Function to open the edit modal
  const handleEditClick = () => {
    if (universeRef.current) {
      console.log('Opening edit modal for universe:', universeRef.current);
      open(MODAL_TYPES.UNIVERSE_CREATE, {
        universe: universeRef.current,
        mode: 'edit',
        title: 'Edit Universe',
        onClose: () => {
          console.log('Edit modal closed');
        },
      });
    }
  };

  if (!universeRef.current) {
    return null;
  }

  return (
    <div className="universe-info-modal">
      <div className="universe-info-header">
        <h2>{universeRef.current.name}</h2>
        <div className="universe-actions">
          <Button type="primary" onClick={handleEditClick}>
            Edit
          </Button>
        </div>
      </div>

      <div className="universe-info-content">
        <div className="info-section">
          <h3>Description</h3>
          <p>{universeRef.current.description || 'No description provided.'}</p>
        </div>

        <div className="info-section">
          <h3>Genre</h3>
          <p>{universeRef.current.genre || 'Not specified'}</p>
        </div>

        <div className="info-section">
          <h3>Theme</h3>
          <p>{universeRef.current.theme || 'Not specified'}</p>
        </div>

        <div className="info-section">
          <h3>Visibility</h3>
          <p>{universeRef.current.is_public ? 'Public' : 'Private'}</p>
        </div>

        <div className="info-section">
          <h3>Created On</h3>
          <p>
            {new Date(universeRef.current.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="universe-info-footer">
        <Button type="secondary" onClick={handleModalClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default UniverseInfoModal;
