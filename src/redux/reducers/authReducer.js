// src/redux/reducers/authReducer.js
import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  forgotPassword,
  loginUser,
  resetPassword,
  resendOTP,
  resendResetOTP,
  signupUser,
  updateZone,
  verifyEmail,
  verifyResetToken,
  refreshAccessToken,
} from "../actions/authActions";
import { getProfile } from "../actions/profileActions";
import { clearAllTokens } from "~utils";

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null, // NEW: Store refresh token
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

  // Pending login credentials for auto-login after email verification
  pendingLoginEmail: null,
  pendingLoginPassword: null,

  // Resend OTP states
  resendOTPLoading: false,
  resendOTPMessage: null,
  resendOTPError: null,

  // Resend Reset OTP states
  resendResetOTPLoading: false,
  resendResetOTPMessage: null,
  resendResetOTPError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      // Clear all tokens from AsyncStorage
      clearAllTokens();

      // Clear notification permission flag so next user gets their own prompt
      AsyncStorage.removeItem("@notification_permission_asked");
      
      // Clear Redux state
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.pendingLoginEmail = null;
      state.pendingLoginPassword = null;
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
    clearResendOTPState(state) {
      state.resendOTPMessage = null;
      state.resendOTPError = null;
    },
    clearResendResetOTPState(state) {
      state.resendResetOTPMessage = null;
      state.resendResetOTPError = null;
    },
    clearPendingLoginCredentials(state) {
      state.pendingLoginEmail = null;
      state.pendingLoginPassword = null;
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
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
        // Clear pending credentials on successful login
        state.pendingLoginEmail = null;
        state.pendingLoginPassword = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        // Check if error requires email verification
        const errorPayload = action.payload;
        if (errorPayload?.requiresEmailVerification) {
          // Store credentials for auto-login after verification
          state.pendingLoginEmail = errorPayload.email;
          state.pendingLoginPassword = errorPayload.password;
          // Keep the entire error object so Login screen can detect requiresEmailVerification
          state.error = errorPayload;
        } else {
          state.error = errorPayload;
        }
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
      })

      // getProfile - Update user in auth state when profile is fetched
      .addCase(getProfile.fulfilled, (state, action) => {
        // Update user in auth state from profile data
        state.user = action.payload;
      })

      // resendOTP - Resend OTP for email verification
      .addCase(resendOTP.pending, state => {
        state.resendOTPLoading = true;
        state.resendOTPError = null;
        state.resendOTPMessage = null;
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPMessage =
          action.payload?.message || "Verification code resent successfully";
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPError = action.payload;
      })

      // resendResetOTP - Resend OTP for reset password
      .addCase(resendResetOTP.pending, state => {
        state.resendResetOTPLoading = true;
        state.resendResetOTPError = null;
        state.resendResetOTPMessage = null;
      })
      .addCase(resendResetOTP.fulfilled, (state, action) => {
        state.resendResetOTPLoading = false;
        state.resendResetOTPMessage =
          action.payload?.message || "Reset code resent successfully";
      })
      .addCase(resendResetOTP.rejected, (state, action) => {
        state.resendResetOTPLoading = false;
        state.resendResetOTPError = action.payload;
      })

      // updateZone
      .addCase(updateZone.fulfilled, (state, action) => {
        if (state.user) {
          state.user.zone = action.payload.zone;
        }
      })

      // ============================================
      // REFRESH ACCESS TOKEN
      // ============================================
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        // Update both access and refresh tokens (token rotation)
        state.accessToken = action.payload.accessToken;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        console.log("✅ Tokens updated in Redux state");
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // Token refresh failed - clear all auth data
        // User will be logged out by axios interceptor
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        console.log("❌ Token refresh failed, clearing auth state");
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
  clearResendOTPState,
  clearResendResetOTPState,
  clearPendingLoginCredentials,
} = authSlice.actions;

export default authSlice.reducer;
