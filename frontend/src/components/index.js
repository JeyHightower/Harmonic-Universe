import React from "react";

// Auth Components
import LoginModal from "./auth/LoginModal";
import SignupModal from "./auth/SignupModal";
import DemoLogin from "./auth/DemoLogin";

export { LoginModal, SignupModal, DemoLogin };

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

// Essential Pages
export { default as Home } from "../pages/Home";

// Character Components
import { CharacterList, CharacterCard, CharacterForm, CharacterDetail } from "./character";
export { CharacterList, CharacterCard, CharacterForm, CharacterDetail };

// Note Components
import { NoteList, NoteCard, NoteForm, NoteDetail } from "./note";
export { NoteList, NoteCard, NoteForm, NoteDetail };

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
const ExportModal = React.lazy(() => import("./common/ExportModal"));
const ImportModal = React.lazy(() => import("./common/ImportModal"));

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

// Lazy loaded component groups - these will only be loaded when needed
export const MusicComponents = {
  MusicPlayer: React.lazy(() => import("./music/MusicPlayer")),
  MusicGenerationModal: React.lazy(() => import("./music/MusicGenerationModal")),
  MusicVisualizer3D: React.lazy(() => import("./music/MusicVisualizer3D")),
  MusicModal: React.lazy(() => import("./music/MusicModal")),
  AudioDetailsModal: React.lazy(() => import("./music/AudioDetailsModal")),
  AudioGenerationModal: React.lazy(() => import("./music/AudioGenerationModal")),
};

export const PhysicsComponents = {
  PhysicsPanel: React.lazy(() => import("./physics/PhysicsPanel")),
  PhysicsEditor: React.lazy(() => import("./physics/PhysicsEditor")),
  PhysicsParametersModal: React.lazy(() => import("./physics/PhysicsParametersModal")),
  PhysicsObjectsManager: React.lazy(() => import("./physics/PhysicsObjectsManager")),
  PhysicsObjectForm: React.lazy(() => import("./physics/PhysicsObjectForm")),
  PhysicsObjectsList: React.lazy(() => import("./physics/PhysicsObjectsList")),
  PhysicsSettingsModal: React.lazy(() => import("./physics/PhysicsSettingsModal")),
  PhysicsParametersManager: React.lazy(() => import("./physics/PhysicsParametersManager")),
};

export const DebugComponents = {
  Debug: React.lazy(() => import("./debug/Debug")),
  DebugControls: React.lazy(() => import("./debug/DebugControls")),
  IconTest: React.lazy(() => import("./debug/IconTest")),
};
