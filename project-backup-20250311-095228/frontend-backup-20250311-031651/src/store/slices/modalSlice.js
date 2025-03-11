import { createSlice } from '@reduxjs/toolkit';
import { MODAL_TYPES } from '../../utils/modalRegistry';

const initialState = {
    modalType: null,
    modalProps: {},
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (state, action) => {
            const { modalType, modalProps = {} } = action.payload;
            state.modalType = modalType;
            state.modalProps = modalProps;
        },
        closeModal: (state) => {
            state.modalType = null;
            state.modalProps = {};
        },
    },
});

export const { openModal, closeModal } = modalSlice.actions;

export const selectModalType = (state) => state.modal.modalType;
export const selectModalProps = (state) => state.modal.modalProps;

export default modalSlice.reducer;
