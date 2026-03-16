import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  getErrorMessage,
  getValidationErrors,
  storeAccessToken,
  storeRefreshToken,
  getRefreshToken,
  clearAllTokens,
  getDeviceInfo,
} from "~utils";
import axios from "~utils/axiosInstance";
import { getPendingInvite, clearPendingInvite } from "~utils/deepLinking";
import { joinCircleViaInvite } from "./inviteActions";
import Toast from "react-native-toast-message";

export const checkPhoneExists = createAsyncThunk(
  "auth/checkPhoneExists",
  async ({ phone }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/check-phone", { phone });
      return response.data; // Expected { exists: true/false } or similar
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// ============================================
// AUTH ACTIONS
// ============================================

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const deviceInfo = await getDeviceInfo();

      const response = await axios.post("/auth/login", {
        email,
        password,
        deviceInfo,
      });


      console.log("response loginUser", response);

      const data = response.data;

      // Persist tokens
      await storeAccessToken(data?.data?.accessToken);
      await storeRefreshToken(data?.data?.refreshToken);

      // Handle deferred deep-link invite
      const pendingInvite = await getPendingInvite();
      if (pendingInvite) {
        setTimeout(async () => {
          try {
            await dispatch(joinCircleViaInvite({ inviteCode: pendingInvite })).unwrap();
            await clearPendingInvite();
            Toast.show({
              type: "success",
              text1: "Joined Circle!",
              text2: "You've been automatically added to the circle",
            });
          } catch {
            Toast.show({
              type: "error",
              text1: "Couldn't Join Circle",
              text2: "You can join manually from the invite link",
            });
          }
        }, 1000);
      }

      return data?.data || data;
    } catch (err) {
      console.log("err loginUser", err);
      const statusCode = err.response?.status;
      const errorData = err.response?.data;
      console.log("errorData loginUser", errorData);

      // Email verification required — pass structured payload
      if (statusCode === 403 && errorData?.data?.isEmailVerified === false) {
        return rejectWithValue({
          requiresEmailVerification: true,
          email,
          password,
          message: errorData?.message || "Please verify your email first.",
        });
      }

      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/registerUser",
  async ({ username, email, password, phone, zone, area }, { rejectWithValue }) => {
console.log('username', username);
console.log('email', email);
console.log('password', password);
console.log('phone', phone);
console.log('zone', zone);
console.log('area', area);
    try {
      const response = await axios.post("/auth/signup", {
        username,
        email,
        password,
        phone,
        zone: zone || "",
        area: area || "",
      });

      return {
        success: true,
        message: response.data?.message || "Account created successfully",
      };
    } catch (err) {

      console.log('err', err)

            const errorData = err.response?.data;
      console.log("errorData loginUser", errorData);
    
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/verify-email", { email, otp });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/forgot-password", { email });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const verifyResetToken = createAsyncThunk(
  "auth/verifyResetToken",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/verify-reset-otp", { email, otp });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, otp, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      if (!email) return rejectWithValue({ message: "Email is required", fields: [] });
      const response = await axios.post("/auth/resend-otp", { email });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const resendResetOTP = createAsyncThunk(
  "auth/resendResetOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      if (!email) return rejectWithValue({ message: "Email is required", fields: [] });
      const response = await axios.post("/auth/resend-reset-otp", { email });
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);

export const updateZone = createAsyncThunk(
  "auth/updateZone",
  async ({ zone }, { rejectWithValue }) => {
    try {
      if (!zone?.trim()) return rejectWithValue("Location is required");

      const trimmedZone = zone.trim();
      await axios.put("/auth/update-zone", { zone: trimmedZone });

      return { zone: trimmedZone };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// TOKEN REFRESH
// Called by axios interceptor when access token expires
// ============================================
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post("/auth/refresh-token", { refreshToken });

      const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
      const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;

      if (!newAccessToken) throw new Error("No access token in response");

      await storeAccessToken(newAccessToken);
      if (newRefreshToken) await storeRefreshToken(newRefreshToken);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      await clearAllTokens();
      return rejectWithValue(getErrorMessage(err) || "Failed to refresh token");
    }
  },
);
