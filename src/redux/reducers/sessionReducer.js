/**
 * Session Reducer
 * Manages session state for viewing and managing active user sessions
 */
import { createSlice } from "@reduxjs/toolkit";
import {
  getSessions,
  logoutSession,
  logoutAllOtherSessions,
  logoutAllSessions,
  logoutCurrentSession,
} from "../actions/sessionActions";

const initialState = {
  sessions: [],
  loading: false,
  error: null,
  
  // Individual action loading states
  logoutCurrentLoading: false,
  logoutSessionLoading: false,
  logoutOtherLoading: false,
  logoutAllLoading: false,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSessionError(state) {
      state.error = null;
    },
    clearSessions(state) {
      state.sessions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // GET SESSIONS
      // ============================================
      .addCase(getSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
        state.error = null;
      })
      .addCase(getSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // LOGOUT SINGLE SESSION
      // ============================================
      .addCase(logoutSession.pending, (state) => {
        state.logoutSessionLoading = true;
        state.error = null;
      })
      .addCase(logoutSession.fulfilled, (state, action) => {
        state.logoutSessionLoading = false;
        // Remove the logged out session from the list
        state.sessions = state.sessions.filter(
          (session) => session.id !== action.payload.sessionId
        );
      })
      .addCase(logoutSession.rejected, (state, action) => {
        state.logoutSessionLoading = false;
        state.error = action.payload;
      })

      // ============================================
      // LOGOUT ALL OTHER SESSIONS
      // ============================================
      .addCase(logoutAllOtherSessions.pending, (state) => {
        state.logoutOtherLoading = true;
        state.error = null;
      })
      .addCase(logoutAllOtherSessions.fulfilled, (state) => {
        state.logoutOtherLoading = false;
        // Keep only the current session (marked as isCurrent: true)
        state.sessions = state.sessions.filter(
          (session) => session.isCurrent === true
        );
      })
      .addCase(logoutAllOtherSessions.rejected, (state, action) => {
        state.logoutOtherLoading = false;
        state.error = action.payload;
      })

      // ============================================
      // LOGOUT ALL SESSIONS
      // ============================================
      .addCase(logoutAllSessions.pending, (state) => {
        state.logoutAllLoading = true;
        state.error = null;
      })
      .addCase(logoutAllSessions.fulfilled, (state) => {
        state.logoutAllLoading = false;
        // Clear all sessions since user is logged out everywhere
        state.sessions = [];
      })
      .addCase(logoutAllSessions.rejected, (state, action) => {
        state.logoutAllLoading = false;
        state.error = action.payload;
      })

      // ============================================
      // LOGOUT CURRENT SESSION
      // ============================================
      .addCase(logoutCurrentSession.pending, (state) => {
        state.logoutCurrentLoading = true;
        state.error = null;
      })
      .addCase(logoutCurrentSession.fulfilled, (state) => {
        state.logoutCurrentLoading = false;
      })
      .addCase(logoutCurrentSession.rejected, (state, action) => {
        state.logoutCurrentLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSessionError, clearSessions } = sessionSlice.actions;

export default sessionSlice.reducer;
