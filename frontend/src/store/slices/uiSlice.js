import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: localStorage.getItem("theme") || "dark",
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
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    showAlert: (state, action) => {
      state.alert = action.payload;
    },
    clearAlert: (state) => {
      state.alert = null;
    },
    showConfirmDialog: (state, action) => {
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
    setLoading: (state, action) => {
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
