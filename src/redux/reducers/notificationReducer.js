/**
 * Notification Reducer
 *
 * Manages:
 * - FCM token sync state (not persisted — re-synced on app restart)
 * - Notification list with pagination, mark-as-read, and clear
 * - Notification preference settings with per-key loading
 *
 * Optimistic updates:
 * - markNotificationRead: flips isRead immediately, reverts on failure
 * - updateNotificationSetting: flips value immediately, reverts on failure
 */
import { createSlice } from "@reduxjs/toolkit";
import {
  syncFCMToken,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  fetchNotificationSettings,
  updateNotificationSetting,
} from "../actions/notificationActions";

const initialState = {
  // FCM token sync
  lastSyncedToken: null,
  syncing: false,
  syncError: null,

  // Notification list
  items: [],
  page: 1,
  totalPages: 1,
  hasMore: false,
  loading: false,

  // Action-specific loading flags
  markingAll: false,
  clearing: false,

  // Notification preference settings
  settings: {
    pushEnabled: true,
    sharedListUpdates: true,
    itemAddedAlerts: true,
    weeklyReminders: true,
    promotions: true,
    tips: true,
  },
  settingsLoading: false,
  settingsError: null,
  updatingKeys: {},
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearSyncError(state) {
      state.syncError = null;
    },
    resetNotificationState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Sync FCM Token ──────────────────────────────────────────────
      .addCase(syncFCMToken.pending, (state) => {
        state.syncing = true;
        state.syncError = null;
      })
      .addCase(syncFCMToken.fulfilled, (state, action) => {
        state.syncing = false;
        if (!action.payload?.skipped) {
          state.lastSyncedToken = action.payload?.fcmToken ?? null;
        }
      })
      .addCase(syncFCMToken.rejected, (state, action) => {
        state.syncing = false;
        state.syncError = action.payload ?? "Failed to sync notification token";
      })

      // ── Fetch Notifications ─────────────────────────────────────────
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { notifications, page, totalPages } = action.payload;
        state.items = page === 1 ? notifications : [...state.items, ...notifications];
        state.page = page;
        state.totalPages = totalPages;
        state.hasMore = page < totalPages;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })

      // ── Mark Single as Read (optimistic) ────────────────────────────
      .addCase(markNotificationRead.pending, (state, action) => {
        const id = action.meta.arg;
        const item = state.items.find((n) => (n._id || n.id) === id);
        if (item) item.isRead = true;
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        const id = action.meta.arg;
        const item = state.items.find((n) => (n._id || n.id) === id);
        if (item) item.isRead = false;
      })

      // ── Mark All as Read ────────────────────────────────────────────
      .addCase(markAllNotificationsRead.pending, (state) => {
        state.markingAll = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.markingAll = false;
        state.items.forEach((n) => {
          n.isRead = true;
        });
      })
      .addCase(markAllNotificationsRead.rejected, (state) => {
        state.markingAll = false;
      })

      // ── Clear All Notifications ─────────────────────────────────────
      .addCase(clearAllNotifications.pending, (state) => {
        state.clearing = true;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.items = [];
        state.page = 1;
        state.totalPages = 1;
        state.hasMore = false;
        state.clearing = false;
      })
      .addCase(clearAllNotifications.rejected, (state) => {
        state.clearing = false;
      })

      // ── Fetch Notification Settings ───────────────────────────────────
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload ?? "Failed to load settings";
      })

      // ── Update Notification Setting (optimistic) ──────────────────────
      .addCase(updateNotificationSetting.pending, (state, action) => {
        const { key, value } = action.meta.arg;
        state.updatingKeys[key] = true;
        state.settings[key] = value;
      })
      .addCase(updateNotificationSetting.fulfilled, (state, action) => {
        const { key } = action.payload;
        delete state.updatingKeys[key];
      })
      .addCase(updateNotificationSetting.rejected, (state, action) => {
        const { key } = action.payload || action.meta.arg;
        delete state.updatingKeys[key];
        state.settings[key] = !state.settings[key];
      });
  },
});

export const { clearSyncError, resetNotificationState } =
  notificationSlice.actions;
export default notificationSlice.reducer;
