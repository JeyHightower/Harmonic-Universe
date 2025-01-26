import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AlertMessage {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  alert: AlertMessage | null;
  confirmDialog: ConfirmDialog;
  isLoading: boolean;
  loadingMessage: string;
}

const initialState: UIState = {
  theme: (localStorage.getItem("theme") as "light" | "dark") || "dark",
  sidebarOpen: true,
  alert: null,
  confirmDialog: {
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    onConfirm: () => {},
  },
  isLoading: false,
  loadingMessage: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", state.theme);
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    showAlert: (state, action: PayloadAction<AlertMessage>) => {
      state.alert = action.payload;
    },
    clearAlert: (state) => {
      state.alert = null;
    },
    showConfirmDialog: (
      state,
      action: PayloadAction<Omit<ConfirmDialog, "isOpen">>,
    ) => {
      state.confirmDialog = {
        ...action.payload,
        isOpen: true,
      };
    },
    hideConfirmDialog: (state) => {
      state.confirmDialog = {
        ...state.confirmDialog,
        isOpen: false,
      };
    },
    setLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; message?: string }>,
    ) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || "";
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  showAlert,
  clearAlert,
  showConfirmDialog,
  hideConfirmDialog,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
