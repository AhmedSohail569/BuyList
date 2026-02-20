/**
 * Notification Reducer
 *
 * Tracks the last synced FCM token to prevent duplicate backend calls.
 * This state is NOT persisted — on app restart the token will be re-synced,
 * which is the correct behaviour (tokens can rotate between sessions).
 */

import { createSlice } from "@reduxjs/toolkit";
import { syncFCMToken } from "../actions/notificationActions";

const initialState = {
  lastSyncedToken: null, // The most recent token successfully sent to backend
  syncing: false,        // Loading state for sync operation
  syncError: null,       // Error message if sync failed
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /**
     * Clears sync error (e.g., on retry)
     */
    clearSyncError(state) {
      state.syncError = null;
    },
    /**
     * Resets notification state on logout so token is re-synced on next login
     */
    resetNotificationState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncFCMToken.pending, (state) => {
        state.syncing = true;
        state.syncError = null;
      })
      .addCase(syncFCMToken.fulfilled, (state, action) => {
        state.syncing = false;
        // Only update lastSyncedToken if the call actually hit the backend
        if (!action.payload?.skipped) {
          state.lastSyncedToken = action.payload?.fcmToken ?? null;
        }
      })
      .addCase(syncFCMToken.rejected, (state, action) => {
        state.syncing = false;
        state.syncError = action.payload ?? "Failed to sync notification token";
      });
  },
});

export const { clearSyncError, resetNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer;
