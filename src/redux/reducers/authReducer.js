// src/redux/reducers/authReducer.js
import {createSlice} from "@reduxjs/toolkit";
import {
  forgotPassword,
  loginUser,
  resetPassword,
  signupUser,
  verifyEmail,
  verifyResetToken,
} from "../actions/authActions";

const initialState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  signupSuccess: false, // Track signup success without storing user data
  signupMessage: null,
  forgotPasswordMessage: null,
  resetTokenValid: null,
  verifyTokenMessage: null, // added
  resetPasswordMessage: null,

  emailVerified: false,
  verifyEmailMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.error = null;
    },
    clearHasLoggedOut(state) {
      state.hasLoggedOut = false;
    },
    clearError(state) {
      state.error = null;
    },
    clearForgotPassword(state) {
      state.forgotPasswordMessage = null;
    },
    clearResetPasswordState(state) {
      state.resetTokenValid = null;
      state.resetPasswordMessage = null;
    },
    clearVerifyTokenMessage(state) {
      // NEW
      state.verifyTokenMessage = null;
    },
    clearSignupState(state) {
      state.signupSuccess = false;
      state.signupMessage = null;
      state.error = null;
    },
    clearVerifyEmailState(state) {
      state.emailVerified = false;
      state.verifyEmailMessage = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // login
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("action.payload", action.payload);
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.token ?? null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // signup - Do NOT store user data, only track success status
      .addCase(signupUser.pending, state => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
        state.signupMessage = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.signupSuccess = true;
        state.signupMessage =
          action.payload.message || "Account created successfully";
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.signupSuccess = false;
      })

      // verify email (OTP)
      .addCase(verifyEmail.pending, state => {
        state.loading = true;
        state.error = null;
        state.verifyEmailMessage = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.emailVerified = true;
        state.verifyEmailMessage =
          action.payload.message || "Email verified successfully";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.emailVerified = false;
      })

      // forgot password
      .addCase(forgotPassword.pending, state => {
        state.loading = true;
        state.error = null;
        state.forgotPasswordMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.forgotPasswordMessage =
          action.payload.message || "Check your email";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // verify reset token
      .addCase(verifyResetToken.pending, state => {
        state.loading = true;
        state.error = null;
        state.resetTokenValid = null;
        state.verifyTokenMessage = null; // reset message
      })
      .addCase(verifyResetToken.fulfilled, (state, action) => {
        state.loading = false;
        state.resetTokenValid = action.payload?.data?.verified ?? false;
        state.verifyTokenMessage = action.payload.message ?? "Token verified"; // store success message
      })
      .addCase(verifyResetToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.resetTokenValid = false;
      })

      // reset password
      .addCase(resetPassword.pending, state => {
        state.loading = true;
        state.error = null;
        state.resetPasswordMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetPasswordMessage =
          action.payload.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  clearHasLoggedOut,
  clearError,
  clearForgotPassword,
  clearResetPasswordState,
  clearVerifyTokenMessage,
  clearSignupState,
  clearVerifyEmailState,
} = authSlice.actions;

export default authSlice.reducer;
