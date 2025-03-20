import React, { useEffect, useState, useRef } from 'react';
import SceneFormModal from './SceneFormModal';

// Global state to prevent modal from unmounting
let modalVisible = false;
let savedUniverseId = null;
let savedSceneId = null;
let savedInitialData = null;
let savedReadOnly = false;
let currentOnCloseFn = null;
let currentOnSuccessFn = null;

const SceneEditModal = ({ universeId, sceneId, initialData, readOnly, onClose, onSuccess }) => {
    const [visible, setVisible] = useState(false);
    const onCloseRef = useRef(onClose);
    const onSuccessRef = useRef(onSuccess);
    const universeIdRef = useRef(universeId);
    const sceneIdRef = useRef(sceneId);
    const initialDataRef = useRef(initialData);
    const readOnlyRef = useRef(readOnly);

    console.log('SceneEditModal rendering:', { universeId, sceneId, initialData, readOnly });

    // Update refs when props change
    useEffect(() => {
        universeIdRef.current = universeId;
        sceneIdRef.current = sceneId;
        initialDataRef.current = initialData;
        readOnlyRef.current = readOnly;
        onCloseRef.current = onClose;
        onSuccessRef.current = onSuccess;
    }, [universeId, sceneId, initialData, readOnly, onClose, onSuccess]);

    // Set up visibility
    useEffect(() => {
        console.log('SceneEditModal useEffect running');

        // Save the data globally to persist across mounts
        if (universeId && sceneId) {
            savedUniverseId = universeId;
            savedSceneId = sceneId;
            savedInitialData = initialData;
            savedReadOnly = readOnly;
            currentOnCloseFn = onClose;
            currentOnSuccessFn = onSuccess;
            modalVisible = true;
            console.log('Setting modalVisible to true for SceneEditModal');
        }

        // Set local state
        setVisible(true);

        // Clean up function
        return () => {
            console.log('SceneEditModal cleanup function running');
            // Don't reset the global state on unmount - that's the key to our fix
        };
    }, [universeId, sceneId, initialData, readOnly, onClose, onSuccess]);

    // Function to safely close the modal
    const handleModalClose = () => {
        console.log('SceneEditModal handleModalClose called');
        modalVisible = false;
        savedUniverseId = null;
        savedSceneId = null;
        savedInitialData = null;
        savedReadOnly = false;

        // Call the original onClose
        if (currentOnCloseFn) {
            currentOnCloseFn();
            currentOnCloseFn = null;
        }
        currentOnSuccessFn = null;
    };

    // Function to handle scene edit success
    const handleSuccess = (data) => {
        console.log('SceneEditModal handleSuccess called with data:', data);

        // Call success callback if provided
        if (currentOnSuccessFn) {
            currentOnSuccessFn(data);
        }

        // Close the modal
        handleModalClose();
    };

    // If we don't have required data, don't render
    if ((!universeId && !savedUniverseId) || (!sceneId && !savedSceneId)) {
        console.log('SceneEditModal returning null - missing required data');
        return null;
    }

    // Use saved values if current props are null
    const displayUniverseId = universeId || savedUniverseId;
    const displaySceneId = sceneId || savedSceneId;
    const displayInitialData = initialData || savedInitialData;
    const displayReadOnly = readOnly !== undefined ? readOnly : savedReadOnly;

    console.log('SceneEditModal rendering form with:', {
        displayUniverseId,
        displaySceneId,
        displayReadOnly
    });

    return (
        <div style={{ pointerEvents: 'auto' }}>
            <SceneFormModal
                universeId={displayUniverseId}
                sceneId={displaySceneId}
                initialData={displayInitialData}
                readOnly={displayReadOnly}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                isCreating={false}
            />
        </div>
    );
};

export default SceneEditModal;
