import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import universeReducer from './slices/universeSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    universe: universeReducer
});

export default rootReducer;
