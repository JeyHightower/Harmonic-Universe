import { configureStore,combineReducers } from '@reduxjs/toolkit';
import { apislice } from '../api/apiSlice';
import authReducer from '../features/Auth/authSlice';
import universeReducer from '../features/Universe/universeSlice';
import characterReducer from '../features/Character/characterSlice';
import noteReducer from '../features/Note/noteSlice';
import locationReducer from '../features/Location/locationSlice';
import adminReducer from '../features/Admin/adminSlice';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// 1. Combine all reducers into the Root Reducer
const rootReducer = combineReducers({
    [apislice.reducerPath]: apislice.reducer,
    auth: authReducer,
    universe: universeReducer,
    character: characterReducer,
    note: noteReducer,
    location: locationReducer,
    admin: adminReducer
});

// 2. Configure Persistence Rules
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'] // Only the auth slice will be saved to local storage
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// 3. The Engine (Store)
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions to avoid console warnings
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(apislice.middleware),
});

// 4. The Persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
