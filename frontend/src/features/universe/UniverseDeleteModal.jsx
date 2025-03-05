import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { deleteUniverse } from '../../store/thunks/universeThunks';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedUniverseId = null;
let savedUniverseName = null;
let currentOnCloseFn = null;
let currentOnSuccessFn = null;

const UniverseDeleteModal = ({ universeId, universeName, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const [visible, setVisible] = useState(false);
    const onCloseRef = useRef(onClose);
    const onSuccessRef = useRef(onSuccess);
    const universeIdRef = useRef(universeId);
    const universeNameRef = useRef(universeName);

    console.log('UniverseDeleteModal rendering with:', { universeId, universeName, modalVisible });

    // Update refs when props change
    useEffect(() => {
        universeIdRef.current = universeId;
        universeNameRef.current = universeName;
        onCloseRef.current = onClose;
        onSuccessRef.current = onSuccess;
    }, [universeId, universeName, onClose, onSuccess]);

    // Set up visibility
    useEffect(() => {
        console.log('UniverseDeleteModal useEffect running');

        // Save the data globally to persist across mounts
        if (universeId) {
            savedUniverseId = universeId;
            savedUniverseName = universeName;
            currentOnCloseFn = onClose;
            currentOnSuccessFn = onSuccess;
            modalVisible = true;
            console.log('Setting modalVisible to true for UniverseDeleteModal');
        }

        // Set local state
        setVisible(true);

        // Clean up function
        return () => {
            console.log('UniverseDeleteModal cleanup function running');
            // Don't reset the global state on unmount - that's the key to our fix
        };
    }, [universeId, universeName, onClose, onSuccess]);

    // Function to safely close the modal
    const handleModalClose = () => {
        console.log('UniverseDeleteModal handleModalClose called');
        modalVisible = false;
        savedUniverseId = null;
        savedUniverseName = null;

        // Call the original onClose
        if (currentOnCloseFn) {
            currentOnCloseFn();
            currentOnCloseFn = null;
        }
        currentOnSuccessFn = null;
    };

    // Function to handle delete confirmation
    const handleConfirm = async () => {
        console.log('UniverseDeleteModal handleConfirm called');
        try {
            const displayUniverseId = universeId || savedUniverseId;
            console.log('Deleting universe with ID:', displayUniverseId);

            // Dispatch the delete action
            await dispatch(deleteUniverse(displayUniverseId)).unwrap();
            console.log('Universe deleted successfully');

            // Call success callback if provided
            if (currentOnSuccessFn) {
                currentOnSuccessFn(displayUniverseId);
            }

            // Close the modal
            handleModalClose();

            // Do NOT automatically reload - this should be handled by the onSuccess callback
            // which might include navigation
        } catch (error) {
            console.error('Error deleting universe:', error);
            // We'll still close the modal even if there's an error
            handleModalClose();
        }
    };

    // If we don't have universe data or modal shouldn't be visible, don't render
    if ((!universeId && !savedUniverseId) || !modalVisible) {
        console.log('UniverseDeleteModal not rendering - missing data or not visible');
        return null;
    }

    // Use saved values if current props are null
    const displayUniverseId = universeId || savedUniverseId;
    const displayUniverseName = universeName || savedUniverseName;

    console.log('UniverseDeleteModal rendering modal for:', displayUniverseName);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            pointerEvents: 'auto'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                pointerEvents: 'auto'
            }}>
                <ConfirmDeleteModal
                    entityType="universe"
                    entityId={displayUniverseId}
                    entityName={displayUniverseName}
                    onConfirm={handleConfirm}
                    onClose={handleModalClose}
                    isGlobalModal={true}
                />
            </div>
        </div>
    );
};

export default UniverseDeleteModal;
