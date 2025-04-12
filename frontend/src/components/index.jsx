import React from "react";

// Auth Components - Fix import paths to use the correct directory structure
import LoginModal from "../features/auth/modals/LoginModal";
import SignupModal from "../features/auth/modals/SignupModal";

// Fallback component for lazy-loaded components that don't exist
const LazyFallbackComponent = () => <div>Component not found</div>;

export { LoginModal, SignupModal };

// Navigation Components
export { default as Navigation } from "./navigation/Navigation";

// Common Components
export { Button } from "./common";
export { default as Icon } from "./common/Icon";
export { default as Input } from "./common/Input";
export { default as Modal } from "./common/Modal";
export { default as Select } from "./common/Select";
export { default as Slider } from "./common/Slider";
export { default as Spinner } from "./common/Spinner";
export { default as Tooltip } from "./common/Tooltip";
export { default as SafeIcon } from "./common/SafeIcon";

// Essential Pages - Remove Home import to fix code-splitting warning
// export { default as Home } from "../pages/Home";

// Character Components - Define fallbacks instead of importing
const CharacterList = LazyFallbackComponent;
const CharacterCard = LazyFallbackComponent;
const CharacterForm = LazyFallbackComponent;
const CharacterDetail = LazyFallbackComponent;
const CharacterManagement = LazyFallbackComponent;

export { CharacterList, CharacterCard, CharacterForm, CharacterDetail, CharacterManagement };

// Note Components - Define fallbacks
const NoteList = LazyFallbackComponent;
const NoteCard = LazyFallbackComponent;
const NoteForm = LazyFallbackComponent;
const NoteDetail = LazyFallbackComponent;
const NoteFormModal = LazyFallbackComponent;

export { NoteList, NoteCard, NoteForm, NoteDetail, NoteFormModal };

// Modal Components
// Import from the modals directory for consistency
import {
  ModalSystem,
  DraggableModal,
  AlertModal,
  ConfirmationModal as ConfirmModal,
  FormModal
} from "./modals";

// Export modal components directly
export { ModalSystem, DraggableModal, AlertModal, ConfirmModal, FormModal };

// Lazily loaded components
const ExportModal = React.lazy(() => Promise.resolve({ default: LazyFallbackComponent }));
const ImportModal = React.lazy(() => Promise.resolve({ default: LazyFallbackComponent }));

// Export these as well
export { ExportModal, ImportModal };

// Also export as an object for backward compatibility
export const ModalComponents = {
  LoginModal,
  SignupModal,
  ModalSystem,
  DraggableModal,
  AlertModal,
  ConfirmModal,
  FormModal,
  ExportModal,
  ImportModal,
};

// Fallback lazy loader that always returns the fallback component
const lazyFallback = () => Promise.resolve({ default: LazyFallbackComponent });

// Lazy loaded component groups - using fallbacks instead of actual imports
export const MusicComponents = {
  MusicPlayer: React.lazy(lazyFallback),
  MusicGenerationModal: React.lazy(lazyFallback),
  MusicVisualizer3D: React.lazy(lazyFallback),
  MusicModal: React.lazy(lazyFallback),
  AudioDetailsModal: React.lazy(lazyFallback),
  AudioGenerationModal: React.lazy(lazyFallback),
};

export const HarmonyComponents = {
  HarmonyPanel: React.lazy(lazyFallback),
  HarmonyParametersModal: React.lazy(lazyFallback),
};

export const UniverseComponents = {
  UniverseCard: React.lazy(lazyFallback),
  UniverseCreate: React.lazy(lazyFallback),
  UniverseDetail: React.lazy(lazyFallback),
  UniverseEdit: React.lazy(lazyFallback),
  UniverseList: React.lazy(lazyFallback),
  UniverseManager: React.lazy(lazyFallback),
  UniverseModal: React.lazy(lazyFallback),
  UniverseDeleteModal: React.lazy(lazyFallback),
  UniverseInfoModal: React.lazy(lazyFallback),
};

export const PhysicsComponents = {
  PhysicsPanel: React.lazy(lazyFallback),
  PhysicsEditor: React.lazy(lazyFallback),
  PhysicsParametersModal: React.lazy(lazyFallback),
  PhysicsObjectsManager: React.lazy(lazyFallback),
  PhysicsObjectForm: React.lazy(lazyFallback),
  PhysicsObjectsList: React.lazy(lazyFallback),
  PhysicsSettingsModal: React.lazy(lazyFallback),
  PhysicsParametersManager: React.lazy(lazyFallback),
  PhysicsObjectModal: React.lazy(lazyFallback),
};

// Note components with fallbacks
export const NoteComponents = {
  NoteList: React.lazy(lazyFallback),
  NoteCard: React.lazy(lazyFallback),
  NoteForm: React.lazy(lazyFallback),
  NoteDetail: React.lazy(lazyFallback),
  NoteFormModal: React.lazy(lazyFallback),
};

export const DebugComponents = {
  Debug: React.lazy(() => import("./debug/Debug")),
  DebugControls: React.lazy(() => import("./debug/DebugControls")),
  IconTest: React.lazy(() => import("./debug/IconTest")),
};
