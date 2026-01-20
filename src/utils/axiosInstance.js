import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "react-native-config";
import {InteractionManager} from "react-native";
import {store} from "~redux/store";
import {logout} from "~redux/reducers/authReducer";
import {showError} from "~utils/toast";

// ✅ Create instance
const axiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 60000, // 60 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Add request interceptor to attach token
axiosInstance.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Track if we're currently handling a 401 to prevent multiple logouts
let isLoggingOut = false;

// Track last network error toast to prevent spam
let lastNetworkErrorTime = 0;
const NETWORK_ERROR_COOLDOWN = 5000; // 5 seconds cooldown between network error toasts

/**
 * Handle unauthorized (401) response
 * Clears user data and logs them out
 * Only shows "Session Expired" if user was previously logged in
 */
const handleUnauthorized = async () => {
  // Prevent multiple logout calls
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    // Check if user was logged in (had a token)
    const token = await AsyncStorage.getItem("accessToken");
    const wasLoggedIn = !!token;

    // Clear access token from AsyncStorage
    await AsyncStorage.removeItem("accessToken");

    // Dispatch logout action to clear Redux state
    store.dispatch(logout());

    // Only show "Session Expired" toast if user was previously logged in
    // Don't show it for login attempts or when user wasn't logged in
    if (wasLoggedIn) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          showError("Session Expired", "Please login again to continue.");
        }, 100);
      });
    }
  } catch (err) {
    console.error("Error during logout:", err);
  } finally {
    // Reset flag after a short delay to allow for redirect
    setTimeout(() => {
      isLoggingOut = false;
    }, 2000);
  }
};

/**
 * Show network error toast with cooldown to prevent spam
 * Uses InteractionManager to avoid TurboModule crashes on iOS
 */
const showNetworkError = () => {
  const now = Date.now();
  if (now - lastNetworkErrorTime > NETWORK_ERROR_COOLDOWN) {
    lastNetworkErrorTime = now;
    // Defer toast to avoid TurboModule crash on iOS
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        showError(
          "Network Error",
          "Please check your internet connection and try again.",
        );
      }, 100);
    });
  }
};

// ✅ Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  response => response,

  async error => {
    console.log("error", error);
    if (error.response) {
      const {status} = error.response;
      console.log("error.response", error.response);

      // 🔒 Handle 401 Unauthorized - Auto logout (only if user was logged in)
      if (status === 401) {
        await handleUnauthorized();
      }
      if (status === 404) {
        showError("Error 404", "Something went wrong!");
      }
    } else if (error.request) {
      // No response received (network error) - show toast
      showNetworkError();
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
