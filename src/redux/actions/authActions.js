import {createAsyncThunk} from "@reduxjs/toolkit";

import {getErrorMessage, storeAccessToken} from "~utils";
import axios from "~utils/axiosInstance";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({email, password}, {rejectWithValue}) => {
    try {
      const response = await axios.post("/auth/login", {email, password});

      const data = response.data;

      console.log("response", response);

      // Save token in AsyncStorage
      await storeAccessToken(data?.data?.token);

      return data?.data || data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/registerUser",
  async ({username, email, password, phone, zone, area}, {rejectWithValue}) => {
    try {
      console.log(
        "name, email, password, phone",
        username,
        email,
        password,
        phone,
      );

      const response = await axios.post("/auth/signup", {
        username,
        email,
        password,
        phone,
        zone: zone || "Karachi",
        area: area || "Gulshan",
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
  async ({email, otp}, {rejectWithValue}) => {
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
  async ({email}, {rejectWithValue}) => {
    try {
      console.log("email", email);
      const response = await axios.post("/auth/forgot-password", {email});
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
  async ({email, otp}, {rejectWithValue}) => {
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
  async ({email, otp, newPassword, confirmPassword}, {rejectWithValue}) => {
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
