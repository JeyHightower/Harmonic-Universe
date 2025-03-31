import React from "react";

// Auth Components
export { LoginModal, SignupModal, DemoLogin } from "./auth";

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

// Modal Components
const ExportModal = React.lazy(() => import("./common/ExportModal"));
const ImportModal = React.lazy(() => import("./common/ImportModal"));

// Export modal components directly
export { ExportModal, ImportModal };

// Also export as an object for backward compatibility
export const ModalComponents = {
  LoginModal,
  SignupModal,
  ExportModal,
  ImportModal,
};

// Lazy loaded components - these will be imported dynamically where needed
export const MusicComponents = {
  MusicPlayer: () => import("./music/MusicPlayer"),
  MusicGenerationModal: () => import("./music/MusicGenerationModal"),
  MusicVisualizer3D: () => import("./music/MusicVisualizer3D"),
  MusicModal: () => import("./music/MusicModal"),
  AudioDetailsModal: () => import("./music/AudioDetailsModal"),
  AudioGenerationModal: () => import("./music/AudioGenerationModal"),
};

export const PhysicsComponents = {
  PhysicsPanel: () => import("./physics/PhysicsPanel"),
  PhysicsEditor: () => import("./physics/PhysicsEditor"),
  PhysicsParametersModal: () => import("./physics/PhysicsParametersModal"),
  PhysicsObjectsManager: () => import("./physics/PhysicsObjectsManager"),
  PhysicsObjectForm: () => import("./physics/PhysicsObjectForm"),
  PhysicsObjectsList: () => import("./physics/PhysicsObjectsList"),
  PhysicsSettingsModal: () => import("./physics/PhysicsSettingsModal"),
  PhysicsParametersManager: () => import("./physics/PhysicsParametersManager"),
};

export const DebugComponents = {
  Debug: () => import("./debug/Debug"),
  DebugControls: () => import("./debug/DebugControls"),
  IconTest: () => import("./debug/IconTest"),
};
