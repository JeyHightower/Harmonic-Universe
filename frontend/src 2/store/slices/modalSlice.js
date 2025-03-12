import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  title: '',
  content: null,
  actionType: null,
  showCancel: true,
  isClosing: false,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isOpen = true;
      state.isClosing = false;
      state.title = action.payload.title;
      state.content = action.payload.content;
      state.actionType = action.payload.actionType;
      state.showCancel = action.payload.showCancel ?? true;
    },
    startClosing: state => {
      state.isClosing = true;
    },
    closeModal: state => {
      return initialState;
    },
  },
});

export const { openModal, startClosing, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
