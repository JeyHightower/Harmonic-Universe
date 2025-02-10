import { modalTypes, useModal } from '@/contexts/ModalContext';
import { CircularProgress } from '@mui/material';
import { lazy, Suspense } from 'react';

// Lazy load all modal components
const CreateUniverseModal = lazy(() => import('./CreateUniverseModal'));
const EditUniverseModal = lazy(() => import('./EditUniverseModal'));
const DeleteUniverseModal = lazy(() => import('./DeleteUniverseModal'));

const CreateVisualizationModal = lazy(() => import('./CreateVisualizationModal'));
const EditVisualizationModal = lazy(() => import('./EditVisualizationModal'));
const DeleteVisualizationModal = lazy(() => import('./DeleteVisualizationModal'));

const CreateAudioModal = lazy(() => import('./CreateAudioModal'));
const EditAudioModal = lazy(() => import('./EditAudioModal'));
const DeleteAudioModal = lazy(() => import('./DeleteAudioModal'));

// Map modal types to their components
const modalComponents = {
  [modalTypes.CREATE_UNIVERSE]: CreateUniverseModal,
  [modalTypes.EDIT_UNIVERSE]: EditUniverseModal,
  [modalTypes.DELETE_UNIVERSE]: DeleteUniverseModal,

  [modalTypes.CREATE_VISUALIZATION]: CreateVisualizationModal,
  [modalTypes.EDIT_VISUALIZATION]: EditVisualizationModal,
  [modalTypes.DELETE_VISUALIZATION]: DeleteVisualizationModal,

  [modalTypes.CREATE_AUDIO]: CreateAudioModal,
  [modalTypes.EDIT_AUDIO]: EditAudioModal,
  [modalTypes.DELETE_AUDIO]: DeleteAudioModal,
};

const ModalManager = () => {
  const { modalState, closeModal } = useModal();
  const { open, type, data } = modalState;

  if (!open || !type) {
    return null;
  }

  const ModalComponent = modalComponents[type];

  if (!ModalComponent) {
    console.error(`No modal component found for type: ${type}`);
    return null;
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </div>
      }
    >
      <ModalComponent open={open} onClose={closeModal} data={data} />
    </Suspense>
  );
};

export default ModalManager;
