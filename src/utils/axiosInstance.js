import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "react-native-config";
import { InteractionManager } from "react-native";
import { forceLogoutAndPurge } from "~redux/store";
import { showError } from "~utils/toast";
import { checkConnectivity, showNoInternetToast } from "~utils/network";
import { getRefreshToken, storeAccessToken, clearAllTokens, storeRefreshToken } from "~utils";

// ── Axios Instance ─────────────────────────────────────────────────────────────

const axiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// ── Request Interceptor — attach access token ──────────────────────────────────

axiosInstance.interceptors.request.use(
  async (config) => {
    // ── Connectivity guard — reject before request fires ──
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      showNoInternetToast();
      const error = new Error("No internet connection");
      error.isOffline = true;
      return Promise.reject(error);
    }

    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Token Refresh Queue ────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Handle Unauthorized — session expired ──────────────────────────────────────

const handleUnauthorized = async () => {
  try {
    await clearAllTokens();
    forceLogoutAndPurge();

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        showError("Session Expired", "Please login again to continue.");
      }, 100);
    });
  } catch {
    // Silently fail — logout is best-effort here
  }
};

// ── Network Error Toast (with cooldown) ────────────────────────────────────────

let lastNetworkErrorTime = 0;
const NETWORK_ERROR_COOLDOWN = 5000;

const showNetworkError = () => {
  const now = Date.now();
  if (now - lastNetworkErrorTime > NETWORK_ERROR_COOLDOWN) {
    lastNetworkErrorTime = now;
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        showError("Network Error", "Please check your internet connection and try again.");
      }, 100);
    });
  }
};

// ── Response Interceptor — handle errors & token refresh ───────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status } = error.response;
      const errorMessage = error.response?.data?.message || "";
      const isLoginRequest = originalRequest.url?.includes("/auth/login");
      const isInvalidCredentials =
        errorMessage.toString().toLowerCase().includes("invalid credential") ||
        errorMessage.toString().toLowerCase().includes("incorrect password") ||
        errorMessage.toString().toLowerCase().includes("user not found");

      // 401 — attempt token refresh (skip for login / invalid-creds)
      if (status === 401 && !originalRequest._retry && !isLoginRequest && !isInvalidCredentials) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await getRefreshToken();
          if (!refreshToken) throw new Error("No refresh token available");

          const response = await axios.post(
            `${Config.API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
          );

          const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
          const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;

          if (!newAccessToken) throw new Error("No access token in response");

          await storeAccessToken(newAccessToken);
          if (newRefreshToken) await storeRefreshToken(newRefreshToken);

          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await handleUnauthorized();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (status === 404) {
        showError("Error 404", "Something went wrong!");
      }
    } else if (error.request && !error.isOffline) {
      // Only show network error for genuine request failures, not offline-rejected ones
      showNetworkError();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
