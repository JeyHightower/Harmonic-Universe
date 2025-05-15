// Export all modal components for easy imports
// NOTE: GlobalModal and ModalProvider have been removed
// We are now using Redux-based modal management exclusively

export { default as AlertModal } from './AlertModal';
export { default as ConfirmationModal } from './ConfirmationModal';
export { default as ConfirmDeleteModal } from './ConfirmDeleteModal';
export { default as DraggableModal } from './DraggableModal';
export { default as FormModal } from './FormModal';
export { default as ModalSystem } from './ModalSystem';
export { default as NetworkErrorModal } from './NetworkErrorModal';
export { default as StableModalWrapper } from './StableModalWrapper';
export { default as TestModal } from './TestModal';

// NOTE: UniverseCreateModal has been deprecated in favor of features/universe/modals/UniverseModal

// Export modal helpers
export * from './modalHelpers';
