import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modalProps: null,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.modalProps = action.payload;
    },
    closeModal: (state) => {
      state.modalProps = null;
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;

export const selectModalProps = (state) => state.modal.modalProps;

export default modalSlice.reducer;
