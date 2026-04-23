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
  checkPhoneExists,
} from "../actions/authActions";
import { googleLogin } from "../actions/googleAuthActions";
import { appleLogin } from "../actions/appleAuthActions";
import { getProfile } from "../actions/profileActions";
import { clearAllTokens } from "~utils";

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,

  // Signup
  signupSuccess: false,
  signupMessage: null,

  // Forgot / Reset password
  forgotPasswordMessage: null,
  resetTokenValid: null,
  verifyTokenMessage: null,
  resetPasswordMessage: null,

  // Email verification
  emailVerified: false,
  verifyEmailMessage: null,

  // Pending login credentials (for auto-login after email verification)
  pendingLoginEmail: null,
  pendingLoginPassword: null,

  // Resend OTP
  resendOTPLoading: false,
  resendOTPMessage: null,
  resendOTPError: null,

  // Resend Reset OTP
  resendResetOTPLoading: false,
  resendResetOTPMessage: null,
  resendResetOTPError: null,
  checkPhoneLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      clearAllTokens();
      AsyncStorage.removeItem("@notification_permission_asked");

      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.pendingLoginEmail = null;
      state.pendingLoginPassword = null;
    },
    setHasUnreadNotifications(state, action) {
      if (state.user) {
        state.user.hasUnreadNotifications = action.payload;
      }
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
  extraReducers: (builder) => {
    builder
      // ── Login ──
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
        state.pendingLoginEmail = null;
        state.pendingLoginPassword = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const errorPayload = action.payload;
        if (errorPayload?.requiresEmailVerification) {
          state.pendingLoginEmail = errorPayload.email;
          state.pendingLoginPassword = errorPayload.password;
        }
        state.error = errorPayload;
      })

      // ── Google Login ──
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Apple Login ──
      .addCase(appleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(appleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken ?? null;
        state.refreshToken = action.payload.refreshToken ?? null;
      })
      .addCase(appleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Signup ──
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.signupSuccess = false;
        state.signupMessage = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.signupSuccess = true;
        state.signupMessage = action.payload.message || "Account created successfully";
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.signupSuccess = false;
      })

      // ── Verify Email ──
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.verifyEmailMessage = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.emailVerified = true;
        state.verifyEmailMessage = action.payload.message || "Email verified successfully";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.emailVerified = false;
      })

      // ── Forgot Password ──
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.forgotPasswordMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.forgotPasswordMessage = action.payload.message || "Check your email";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Verify Reset Token ──
      .addCase(verifyResetToken.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetTokenValid = null;
        state.verifyTokenMessage = null;
      })
      .addCase(verifyResetToken.fulfilled, (state, action) => {
        state.loading = false;
        state.resetTokenValid = action.payload?.data?.verified ?? false;
        state.verifyTokenMessage = action.payload.message ?? "Token verified";
      })
      .addCase(verifyResetToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.resetTokenValid = false;
      })

      // ── Reset Password ──
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetPasswordMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetPasswordMessage = action.payload.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── Profile Sync ──
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // ── Resend OTP ──
      .addCase(resendOTP.pending, (state) => {
        state.resendOTPLoading = true;
        state.resendOTPError = null;
        state.resendOTPMessage = null;
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPMessage = action.payload?.message || "Verification code resent successfully";
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.resendOTPLoading = false;
        state.resendOTPError = action.payload;
      })

      // ── Resend Reset OTP ──
      .addCase(resendResetOTP.pending, (state) => {
        state.resendResetOTPLoading = true;
        state.resendResetOTPError = null;
        state.resendResetOTPMessage = null;
      })
      .addCase(resendResetOTP.fulfilled, (state, action) => {
        state.resendResetOTPLoading = false;
        state.resendResetOTPMessage = action.payload?.message || "Reset code resent successfully";
      })
      .addCase(resendResetOTP.rejected, (state, action) => {
        state.resendResetOTPLoading = false;
        state.resendResetOTPError = action.payload;
      })

      // ── Update Zone ──
      .addCase(updateZone.fulfilled, (state, action) => {
        if (state.user) {
          state.user.zone = action.payload.zone;
        }
      })

      // ── Token Refresh ──
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      })
      
      // ── Check Phone ──
      .addCase(checkPhoneExists.pending, (state) => {
        state.checkPhoneLoading = true;
        state.error = null;
      })
      .addCase(checkPhoneExists.fulfilled, (state) => {
        state.checkPhoneLoading = false;
      })
      .addCase(checkPhoneExists.rejected, (state, action) => {
        state.checkPhoneLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  logout,
  setHasUnreadNotifications,
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
