/**
 * Session Management Actions
 * Handle user session operations: view, logout single, logout others, logout all
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";
import Toast from "react-native-toast-message";

/**
 * Get all active sessions for the current user
 * GET /session/get-sessions
 * Returns: Array of session objects with device info, location, last active, etc.
 */
export const getSessions = createAsyncThunk(
  "session/getSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/session/get-sessions");
      const sessions = response.data?.data || response.data;

      console.log("✅ Sessions fetched:", sessions);

      return sessions;
    } catch (err) {
      console.error("❌ Failed to fetch sessions:", err);
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  }
);

/**
 * Logout a specific session by ID
 * POST /session/logout-single/{sessionId}
 * @param {string} sessionId - The session ID to logout
 */
export const logoutSession = createAsyncThunk(
  "session/logoutSession",
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/session/logout-single/${sessionId}`);
      const data = response.data?.data || response.data;

      console.log("✅ Session logged out:", sessionId);

      Toast.show({
        type: "success",
        text1: "Session Ended",
        text2: "The selected session has been logged out",
      });

      return {
        sessionId,
        message: data?.message || "Session logged out successfully",
      };
    } catch (err) {
      console.error("❌ Failed to logout session:", err);
      const message = getErrorMessage(err);
      
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout session",
      });

      return rejectWithValue(message);
    }
  }
);

/**
 * Logout all other sessions except the current one
 * POST /session/logout-other
 */
export const logoutAllOtherSessions = createAsyncThunk(
  "session/logoutAllOtherSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete("/session/logout-other");
      const data = response.data?.data || response.data;

      console.log("✅ All other sessions logged out");

      Toast.show({
        type: "success",
        text1: "Sessions Ended",
        text2: "All other sessions have been logged out",
      });

      return {
        message: data?.message || "Other sessions logged out successfully",
      };
    } catch (err) {
      console.error("❌ Failed to logout other sessions:", err);
      const message = getErrorMessage(err);
      
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout other sessions",
      });

      return rejectWithValue(message);
    }
  }
);

/**
 * Logout ALL sessions including the current one
 * POST /session/logout-all
 * Note: This will log out the user from the current device as well
 */
export const logoutAllSessions = createAsyncThunk(
  "session/logoutAllSessions",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.delete("/session/logout-all");
      const data = response.data?.data || response.data;

      console.log("✅ All sessions logged out");

      Toast.show({
        type: "success",
        text1: "All Sessions Ended",
        text2: "You have been logged out from all devices",
      });

      // Note: User will be automatically logged out by the backend
      // The app should redirect to login screen
      return {
        message: data?.message || "All sessions logged out successfully",
      };
    } catch (err) {
      console.error("❌ Failed to logout all sessions:", err);
      const message = getErrorMessage(err);
      
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout all sessions",
      });

      return rejectWithValue(message);
    }
  }
);

/**
 * Logout the current device session on the server.
 * POST /session/logout-current
 *
 * Call this BEFORE clearing local tokens so the Authorization header is still
 * attached by the axios interceptor. Errors are silently ignored — a network
/**
 * Logout the current device session on the server.
 * POST /session/logout-current
 *
 * On success  → caller proceeds to wipe local state.
 * On failure  → rejects so the caller can show an error and keep the user logged in.
 */
export const logoutCurrentSession = createAsyncThunk(
  "session/logoutCurrentSession",
  async (_, { rejectWithValue }) => {
    console.log("logoutCurrentSession");
    try {
      const response = await axios.post("/session/logout-current");
      console.log("✅ Current session logged out on server");
      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("❌ logoutCurrentSession failed:", message);
      return rejectWithValue(message || "Failed to logout. Please try again.");
    }
  }
);
