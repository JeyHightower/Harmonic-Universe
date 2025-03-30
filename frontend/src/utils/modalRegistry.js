import React from "react";
import { MODAL_TYPES } from "./config";
import ModalSystem from "../components/modals";

// Lazy load modal components
const LoginModal = React.lazy(() => import("../components/auth/LoginModal"));
const RegisterModal = React.lazy(() =>
  import("../components/auth/RegisterModal")
);
const SettingsModal = React.lazy(() =>
  import("../components/settings/SettingsModal")
);
const CreateUniverseModal = React.lazy(() =>
  import("../components/universe/CreateUniverseModal")
);
const EditUniverseModal = React.lazy(() =>
  import("../components/universe/EditUniverseModal")
);
const DeleteUniverseModal = React.lazy(() =>
  import("../components/universe/DeleteUniverseModal")
);
const CreateSceneModal = React.lazy(() =>
  import("../components/scenes/CreateSceneModal")
);
const EditSceneModal = React.lazy(() =>
  import("../components/scenes/EditSceneModal")
);
const DeleteSceneModal = React.lazy(() =>
  import("../components/scenes/DeleteSceneModal")
);
const CreatePhysicsObjectModal = React.lazy(() =>
  import("../components/physics/CreatePhysicsObjectModal")
);
const EditPhysicsObjectModal = React.lazy(() =>
  import("../components/physics/EditPhysicsObjectModal")
);
const DeletePhysicsObjectModal = React.lazy(() =>
  import("../components/physics/DeletePhysicsObjectModal")
);
const PhysicsParametersModal = React.lazy(() =>
  import("../components/physics/PhysicsParametersModal")
);
const HarmonyParametersModal = React.lazy(() =>
  import("../components/harmony/HarmonyParametersModal")
);
const ExportModal = React.lazy(() =>
  import("../components/common/ExportModal")
);
const ImportModal = React.lazy(() =>
  import("../components/common/ImportModal")
);

export const getModalComponent = (type) => {
  switch (type) {
    case MODAL_TYPES.LOGIN:
      return LoginModal;
    case MODAL_TYPES.REGISTER:
      return RegisterModal;
    case MODAL_TYPES.SETTINGS:
      return SettingsModal;
    case MODAL_TYPES.CREATE_UNIVERSE:
      return CreateUniverseModal;
    case MODAL_TYPES.EDIT_UNIVERSE:
      return EditUniverseModal;
    case MODAL_TYPES.DELETE_UNIVERSE:
      return DeleteUniverseModal;
    case MODAL_TYPES.CREATE_SCENE:
      return CreateSceneModal;
    case MODAL_TYPES.EDIT_SCENE:
      return EditSceneModal;
    case MODAL_TYPES.DELETE_SCENE:
      return DeleteSceneModal;
    case MODAL_TYPES.CREATE_PHYSICS_OBJECT:
      return CreatePhysicsObjectModal;
    case MODAL_TYPES.EDIT_PHYSICS_OBJECT:
      return EditPhysicsObjectModal;
    case MODAL_TYPES.DELETE_PHYSICS_OBJECT:
      return DeletePhysicsObjectModal;
    case MODAL_TYPES.PHYSICS_PARAMETERS:
      return PhysicsParametersModal;
    case MODAL_TYPES.HARMONY_PARAMETERS:
      return HarmonyParametersModal;
    case MODAL_TYPES.EXPORT:
      return ExportModal;
    case MODAL_TYPES.IMPORT:
      return ImportModal;
    default:
      console.error(`No modal component found for type: ${type}`);
      return ModalSystem;
  }
};

export const getModalTitle = (type) => {
  switch (type) {
    case MODAL_TYPES.LOGIN:
      return "Login";
    case MODAL_TYPES.REGISTER:
      return "Register";
    case MODAL_TYPES.SETTINGS:
      return "Settings";
    case MODAL_TYPES.CREATE_UNIVERSE:
      return "Create Universe";
    case MODAL_TYPES.EDIT_UNIVERSE:
      return "Edit Universe";
    case MODAL_TYPES.DELETE_UNIVERSE:
      return "Delete Universe";
    case MODAL_TYPES.CREATE_SCENE:
      return "Create Scene";
    case MODAL_TYPES.EDIT_SCENE:
      return "Edit Scene";
    case MODAL_TYPES.DELETE_SCENE:
      return "Delete Scene";
    case MODAL_TYPES.CREATE_PHYSICS_OBJECT:
      return "Create Physics Object";
    case MODAL_TYPES.EDIT_PHYSICS_OBJECT:
      return "Edit Physics Object";
    case MODAL_TYPES.DELETE_PHYSICS_OBJECT:
      return "Delete Physics Object";
    case MODAL_TYPES.PHYSICS_PARAMETERS:
      return "Physics Parameters";
    case MODAL_TYPES.HARMONY_PARAMETERS:
      return "Harmony Parameters";
    case MODAL_TYPES.EXPORT:
      return "Export";
    case MODAL_TYPES.IMPORT:
      return "Import";
    default:
      return "Modal";
  }
};

export const isValidModalType = (type) => {
  return Object.values(MODAL_TYPES).includes(type);
};
