/**
 * Notification Redux Actions
 * Handles FCM token sync, fetching notifications, mark-as-read, and clear.
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";

/**
 * Sync FCM device token to backend.
 * Skips if the token hasn't changed since last successful sync.
 */
export const syncFCMToken = createAsyncThunk(
  "notifications/syncFCMToken",
  async (fcmToken, { getState, rejectWithValue }) => {
    try {
      const { notifications } = getState();
      if (notifications?.lastSyncedToken === fcmToken) {
        return { fcmToken, skipped: true };
      }
      const response = await axios.patch("/session/fcm-token", { fcmToken });
      return { fcmToken, message: response.data?.message };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch paginated notifications.
 * Skipped automatically if a fetch is already in progress.
 */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `/notifications/get-notifications?page=${page}`,
      );
      console.log("res", res);
      const data =
        res.data?.data?.notifications ||
        res.data?.data ||
        res.data?.notifications ||
        [];
      const totalPages =
        res.data?.data?.totalPages || res.data?.totalPages || 1;
      return { notifications: data, page, totalPages };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_, { getState }) => !getState().notifications.loading,
  },
);

/**
 * Mark a single notification as read (optimistic).
 * The reducer updates immediately; reverts on failure.
 */
export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      await axios.patch(`/notifications/mark-single-read/${notificationId}`);
      return { notificationId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      await axios.patch("/notifications/all-read");
      return {};
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Clear (delete) all notifications.
 */
export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAllNotifications",
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete("/notifications/clear-notifications");
      return {};
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);
