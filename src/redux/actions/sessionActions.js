/**
 * Session Management Actions
 * Handles: view sessions, logout single/other/all/current
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";
import Toast from "react-native-toast-message";

/**
 * Fetch all active sessions for the current user
 * GET /session/get-sessions
 */
export const getSessions = createAsyncThunk(
  "session/getSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/session/get-sessions");
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

/**
 * Logout a specific session by ID
 * DELETE /session/logout-single/{sessionId}
 */
export const logoutSession = createAsyncThunk(
  "session/logoutSession",
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/session/logout-single/${sessionId}`);
      const data = response.data?.data || response.data;

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
      const message = getErrorMessage(err);
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout session",
      });
      return rejectWithValue(message);
    }
  },
);

/**
 * Logout all other sessions except the current one
 * DELETE /session/logout-other
 */
export const logoutAllOtherSessions = createAsyncThunk(
  "session/logoutAllOtherSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete("/session/logout-other");
      const data = response.data?.data || response.data;

      Toast.show({
        type: "success",
        text1: "Sessions Ended",
        text2: "All other sessions have been logged out",
      });

      return {
        message: data?.message || "Other sessions logged out successfully",
      };
    } catch (err) {
      const message = getErrorMessage(err);
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout other sessions",
      });
      return rejectWithValue(message);
    }
  },
);

/**
 * Logout ALL sessions including the current one
 * DELETE /session/logout-all
 * Note: The caller (logoutAllAndPurge) handles local state cleanup.
 */
export const logoutAllSessions = createAsyncThunk(
  "session/logoutAllSessions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete("/session/logout-all");
      const data = response.data?.data || response.data;

      return {
        message: data?.message || "All sessions logged out successfully",
      };
    } catch (err) {
      const message = getErrorMessage(err);
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: message || "Could not logout all sessions",
      });
      return rejectWithValue(message);
    }
  },
);

/**
 * Logout the current device session on the server
 * POST /session/logout-current
 * Called by logoutAndPurge — errors reject so the caller can surface them.
 */
export const logoutCurrentSession = createAsyncThunk(
  "session/logoutCurrentSession",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post("/session/logout-current");
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err) || "Failed to logout. Please try again.");
    }
  },
);
