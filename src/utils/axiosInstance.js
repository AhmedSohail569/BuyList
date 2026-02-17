import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "react-native-config";
import {InteractionManager} from "react-native";
import {store} from "~redux/store";
import {logout} from "~redux/reducers/authReducer";
import {showError} from "~utils/toast";
import {getRefreshToken, storeAccessToken, clearAllTokens, storeRefreshToken} from "~utils";

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

// ============================================
// TOKEN REFRESH LOGIC
// ============================================

// Queue for requests waiting for token refresh
let isRefreshing = false;
let failedQueue = [];

/**
 * Process all queued requests after token refresh
 * @param {Error} error - Error if refresh failed
 * @param {string} token - New access token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Handle unauthorized (401) response
 * Clears user data and logs them out
 */
const handleUnauthorized = async () => {
  try {
    // Clear all tokens from AsyncStorage
    await clearAllTokens();

    // Dispatch logout action to clear Redux state
    store.dispatch(logout());

    // Show session expired toast
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        showError("Session Expired", "Please login again to continue.");
      }, 100);
    });
  } catch (err) {
    console.error("Error during logout:", err);
  }
};

// Track last network error toast to prevent spam
let lastNetworkErrorTime = 0;
const NETWORK_ERROR_COOLDOWN = 5000; // 5 seconds cooldown between network error toasts

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
    const originalRequest = error.config;

    console.log("error", error);

    if (error.response) {
      const {status} = error.response;
      console.log("error.response", error.response);

      // Extract error details
      const errorMessage = error.response?.data?.message || "";
      const isLoginRequest = originalRequest.url?.includes("/auth/login");
      const isInvalidCredentials = 
        errorMessage.toString().toLowerCase().includes("invalid credential") ||
        errorMessage.toString().toLowerCase().includes("incorrect password") ||
        errorMessage.toString().toLowerCase().includes("user not found");

      // 🔒 Handle 401 Unauthorized - Try token refresh
      // Skip if it's a login request or invalid credentials error
      if (status === 401 && !originalRequest._retry && !isLoginRequest && !isInvalidCredentials) {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({resolve, reject});
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        // Mark request as retry to prevent infinite loops
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token
          const refreshToken = await getRefreshToken();
          
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Call refresh token endpoint
          const response = await axios.post(
            `${Config.API_BASE_URL}/auth/refresh-token`,
            {refreshToken},
          );

          console.log('response==>', response)

          const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
          const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;

          if (!newAccessToken) {
            throw new Error("No access token in response");
          }

          // Store new access token
          await storeAccessToken(newAccessToken);

          // Store new refresh token (token rotation)
          if (newRefreshToken) {
            await storeRefreshToken(newRefreshToken);
          }

          // Update axios default headers
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          console.log("✅ Token refreshed, retrying queued requests");

          // Process all queued requests with new token
          processQueue(null, newAccessToken);

          // Retry the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);

          // Process queue with error
          processQueue(refreshError, null);

          // Logout user
          await handleUnauthorized();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle other HTTP errors
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
