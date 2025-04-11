import React from "react";

// Auth Components
import LoginModal from "./features/auth/modals/LoginModal";
import SignupModal from "./features/auth/modals/SignupModal";

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

// Character Components
import { CharacterList, CharacterCard, CharacterForm, CharacterDetail, CharacterManagement } from "./features/character";
export { CharacterList, CharacterCard, CharacterForm, CharacterDetail, CharacterManagement };

// Note Components
export { NoteList, NoteCard, NoteForm, NoteDetail, NoteFormModal } from "./features/note";

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
  MusicPlayer: React.lazy(() => import("./features/music/MusicPlayer")),
  MusicGenerationModal: React.lazy(() => import("./features/music/MusicModal")),
  MusicVisualizer3D: React.lazy(() => import("./features/music/MusicVisualizer3D")),
  MusicModal: React.lazy(() => import("./features/music/MusicModal")),
  AudioDetailsModal: React.lazy(() => import("./features/music/AudioDetailsModal")),
  AudioGenerationModal: React.lazy(() => import("./features/music/AudioGenerationModal")),
};

export const HarmonyComponents = {
  HarmonyPanel: React.lazy(() => import("./features/harmony/components/HarmonyPanel")),
  HarmonyParametersModal: React.lazy(() => import("./features/harmony/modals/HarmonyParametersModal")),
};

export const UniverseComponents = {
  UniverseCard: React.lazy(() => import("./features/universe/UniverseCard")),
  UniverseCreate: React.lazy(() => import("./features/universe/UniverseCreate")),
  UniverseDetail: React.lazy(() => import("./features/universe/UniverseDetail")),
  UniverseEdit: React.lazy(() => import("./features/universe/UniverseEdit")),
  UniverseList: React.lazy(() => import("./features/universe/UniverseList")),
  UniverseManager: React.lazy(() => import("./features/universe/UniverseManager")),
  UniverseModal: React.lazy(() => import("./features/universe/UniverseModal")),
  UniverseDeleteModal: React.lazy(() => import("./features/universe/UniverseDeleteModal")),
  UniverseInfoModal: React.lazy(() => import("./features/universe/UniverseInfoModal")),
};

export const PhysicsComponents = {
  PhysicsPanel: React.lazy(() => import("./features/physics/components/PhysicsPanel")),
  PhysicsEditor: React.lazy(() => import("./features/physics/pages/PhysicsEditor")),
  PhysicsParametersModal: React.lazy(() => import("./features/physics/modals/PhysicsParametersModal")),
  PhysicsObjectsManager: React.lazy(() => import("./features/physics/components/PhysicsObjectsManager")),
  PhysicsObjectForm: React.lazy(() => import("./features/physics/components/PhysicsObjectForm")),
  PhysicsObjectsList: React.lazy(() => import("./features/physics/components/PhysicsObjectsList")),
  PhysicsSettingsModal: React.lazy(() => import("./features/physics/modals/PhysicsSettingsModal")),
  PhysicsParametersManager: React.lazy(() => import("./features/physics/components/PhysicsParametersManager")),
  PhysicsObjectModal: React.lazy(() => import("./features/physics/modals/PhysicsObjectModal")),
};

// Update to use the new feature-based note components
export const NoteComponents = {
  NoteList: React.lazy(() => import("./features/note/components/NoteList")),
  NoteCard: React.lazy(() => import("./features/note/components/NoteCard")),
  NoteForm: React.lazy(() => import("./features/note/pages/NoteForm")),
  NoteDetail: React.lazy(() => import("./features/note/pages/NoteDetail")),
  NoteFormModal: React.lazy(() => import("./features/note/modals/NoteFormModal")),
};

export const DebugComponents = {
  Debug: React.lazy(() => import("./debug/Debug")),
  DebugControls: React.lazy(() => import("./debug/DebugControls")),
  IconTest: React.lazy(() => import("./debug/IconTest")),
};
