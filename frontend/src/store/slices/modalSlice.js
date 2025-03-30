import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  type: null,
  title: "",
  content: null,
  actionType: null,
  severity: "info",
  showCancel: false,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      const { type, title, content, actionType, severity, showCancel } =
        action.payload;
      state.isOpen = true;
      state.type = type;
      state.title = title || "";
      state.content = content;
      state.actionType = actionType;
      state.severity = severity || "info";
      state.showCancel = showCancel || false;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.type = null;
      state.title = "";
      state.content = null;
      state.actionType = null;
      state.severity = "info";
      state.showCancel = false;
    },
    updateModalContent: (state, action) => {
      state.content = action.payload;
    },
  },
});

export const { openModal, closeModal, updateModalContent } = modalSlice.actions;

export default modalSlice.reducer;
