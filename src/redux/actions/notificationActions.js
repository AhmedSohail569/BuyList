/**
 * Notification Redux Actions
 *
 * Handles syncing the FCM device token to the backend.
 * Token is associated with the authenticated user via Bearer token in Axios.
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";

/**
 * Syncs the FCM device token to the backend.
 *
 * Guards against duplicate submissions by comparing the incoming token
 * with the last successfully synced token stored in Redux.
 *
 * @param {string} fcmToken - The FCM device token to register
 */
export const syncFCMToken = createAsyncThunk(
  "notifications/syncFCMToken",
  async (fcmToken, { getState, rejectWithValue }) => {
    try {
      // Guard: skip if token hasn't changed (avoids redundant API calls)
      const { notifications } = getState();
      if (notifications?.lastSyncedToken === fcmToken) {
        console.log("⏭️  FCM token unchanged — skipping sync");
        return { fcmToken, skipped: true };
      }

      console.log("📤 Syncing FCM token to backend...");

      const response = await axios.patch("/session/fcm-token", {
        fcmToken,
      });

      console.log("✅ FCM token synced:", response.data?.message);

      return { fcmToken, message: response.data?.message };
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("❌ Failed to sync FCM token:", message);
      // Use rejectWithValue to prevent unhandled promise rejection crashes
      return rejectWithValue(message);
    }
  },
);
