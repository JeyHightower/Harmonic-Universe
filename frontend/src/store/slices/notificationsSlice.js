import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationsService } from '../../services/notificationsService';

const initialState = {
  notifications: [],
  settings: {
    sound: true,
    desktop: true,
    duration: 5000,
  },
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsService.getNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationsService.markAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      );
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsService.clearAll();
      return null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear notifications'
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(
          n => n.id === action.payload.id
        );
        if (notification) {
          notification.read = true;
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Clear All
      .addCase(clearAllNotifications.fulfilled, state => {
        state.notifications = [];
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  addNotification,
  removeNotification,
  updateSettings,
  clearError,
} = notificationsSlice.actions;

export const selectNotifications = state => state.notifications.notifications;
export const selectUnreadCount = state =>
  state.notifications.notifications.filter(n => !n.read).length;
export const selectSettings = state => state.notifications.settings;
export const selectNotificationsLoading = state => state.notifications.loading;
export const selectNotificationsError = state => state.notifications.error;

export default notificationsSlice.reducer;
