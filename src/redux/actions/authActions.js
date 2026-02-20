import { createAsyncThunk } from "@reduxjs/toolkit";

import { 
  getErrorMessage, 
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

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      // Get device information
      const deviceInfo = await getDeviceInfo();
      console.log("📱 Device Info:", deviceInfo);

      // Send login request with device info
      const response = await axios.post("/auth/login", { 
        email, 
        password,
        deviceInfo,
      });

      const data = response.data;

      console.log("response", response);
      
//       console.log('data?.data', data?.data)
// console.log('data?.data?.accessToken', data?.data?.accessToken)
// console.log('data?.data?.refreshToken', data?.data?.refreshToken)

      // Save both access and refresh tokens in AsyncStorage
      await storeAccessToken(data?.data?.accessToken);
      await storeRefreshToken(data?.data?.refreshToken);

      // Check for pending invite (deferred deep linking)
      const pendingInvite = await getPendingInvite();
      if (pendingInvite) {
        console.log("Found pending invite, auto-joining circle:", pendingInvite);
        
        // Short delay to ensure auth token is set
        setTimeout(async () => {
          try {
            await dispatch(joinCircleViaInvite({ inviteCode: pendingInvite })).unwrap();
            await clearPendingInvite();
            
            Toast.show({
              type: "success",
              text1: "Joined Circle!",
              text2: "You've been automatically added to the circle",
            });
          } catch (err) {
            console.error("Auto-join failed:", err);
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
      // Check if error is 403 with email verification required
      const statusCode = err.response?.status;
      const errorData = err.response?.data;


      if (statusCode === 403 && errorData?.data?.isEmailVerified === false) {
        // Return special error payload for email verification flow
        return rejectWithValue({
          requiresEmailVerification: true,
          email,
          password,
          message: errorData?.message || "Please verify your email first.",
        });
      }

      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/registerUser",
  async ({ username, email, password, phone, zone, area }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/signup", {
        username,
        email,
        password,
        phone,
        zone: zone || "",
        area: area || "",
      });
      console.log("response", response);
      const data = response.data;

      // Do NOT save token - user must login after signup
      // Return only success status, not user data
      return {
        success: true,
        message: data?.message || "Account created successfully",
      };
    } catch (err) {
      console.log("err", err);
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Verify Email OTP
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      console.log("email, otp", email, otp);
      const response = await axios.post("/auth/verify-email", {
        email,
        otp,
      });

      return response.data;
      // expected: { success: true, message: "Email verified successfully" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      console.log("email", email);
      const response = await axios.post("/auth/forgot-password", { email });
      console.log("responseForgot", response);
      return response.data; // e.g., { message: "Reset email sent" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Verify reset token
export const verifyResetToken = createAsyncThunk(
  "auth/verifyResetToken",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post("/auth/verify-reset-otp", {
        email,
        otp,
      });
      console.log("response, email, otp", response, email, otp);
      return response.data; // e.g., { valid: true, email: "user@example.com" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Reset password
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
      console.log(
        "email, otp, newPassword, response",
        email,
        otp,
        newPassword,
        response,
      );
      return response.data; // e.g., { message: "Password reset successful" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Resend OTP for email verification
export const resendOTP = createAsyncThunk(
  "auth/resendOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      if (!email) {
        return rejectWithValue("Email is required");
      }
      const response = await axios.post("/auth/resend-otp", { email });
      return response.data; // e.g., { message: "OTP resent successfully" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Update user zone (home location)
export const updateZone = createAsyncThunk(
  "auth/updateZone",
  async ({ zone }, { rejectWithValue }) => {
    try {
      if (!zone?.trim()) {
        return rejectWithValue("Location is required");
      }

      const response = await axios.put("/auth/update-zone", {
        zone: zone.trim(),
      });

      console.log("response", response);

      return {
        zone: zone.trim(),
        data: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// Resend OTP for reset password
export const resendResetOTP = createAsyncThunk(
  "auth/resendResetOTP",
  async ({ email }, { rejectWithValue }) => {
    try {
      if (!email) {
        return rejectWithValue("Email is required");
      }
      const response = await axios.post("/auth/resend-reset-otp", { email });
      return response.data; // e.g., { message: "Reset OTP resent successfully" }
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// REFRESH ACCESS TOKEN
// Automatically called by axios interceptor when access token expires
// ============================================
export const refreshAccessToken = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call refresh token endpoint
      const response = await axios.post("/auth/refresh-token", {
        refreshToken,
      });

      console.log('response', response)

      const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
      const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;
      
      if (!newAccessToken) {
        throw new Error("No access token in response");
      }

      // Store new access token
      await storeAccessToken(newAccessToken);

      // Store new refresh token (token rotation for security)
      if (newRefreshToken) {
        await storeRefreshToken(newRefreshToken);
        console.log("✅ Refresh token rotated successfully");
      }

      console.log("✅ Access token refreshed successfully");

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken, // Return new refresh token
      };
    } catch (err) {
      console.error("❌ Token refresh failed:", err);
      
      // Clear all tokens on refresh failure
      await clearAllTokens();
      
      const message = getErrorMessage(err);
      return rejectWithValue(message || "Failed to refresh token");
    }
  },
);
