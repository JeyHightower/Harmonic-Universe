import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  content: null,
  title: '',
  onConfirm: null,
  showCancel: true,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isOpen = true;
      state.content = action.payload.content;
      state.title = action.payload.title;
      state.onConfirm = action.payload.onConfirm;
      state.showCancel = action.payload.showCancel ?? true;
    },
    closeModal: state => {
      state.isOpen = false;
      state.content = null;
      state.title = '';
      state.onConfirm = null;
      state.showCancel = true;
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
