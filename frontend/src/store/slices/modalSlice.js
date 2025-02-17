import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  title: '',
  content: null,
  actionType: null,
  showCancel: true,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.content = action.payload.content;
      state.actionType = action.payload.actionType;
      state.showCancel = action.payload.showCancel ?? true;
    },
    closeModal: state => {
      state.isOpen = false;
      state.title = '';
      state.content = null;
      state.actionType = null;
      state.showCancel = true;
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
