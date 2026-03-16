import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";

// ── Token Management ───────────────────────────────────────────────────────────

export const storeAccessToken = async (token) => {
  try {
    if (token) await AsyncStorage.setItem("accessToken", token);
  } catch (error) {
    console.warn("Error saving access token:", error);
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

export const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem("accessToken");
  } catch {
    // Silent fail
  }
};

export const storeRefreshToken = async (token) => {
  try {
    if (token) await AsyncStorage.setItem("refreshToken", token);
  } catch (error) {
    console.warn("Error saving refresh token:", error);
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem("refreshToken");
  } catch {
    return null;
  }
};

export const clearRefreshToken = async () => {
  try {
    await AsyncStorage.removeItem("refreshToken");
  } catch {
    // Silent fail
  }
};

/**
 * Clear both access and refresh tokens
 */
export const clearAllTokens = async () => {
  try {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
  } catch {
    // Silent fail
  }
};

// ── Device Info ────────────────────────────────────────────────────────────────

/**
 * Get device model name for session tracking
 * @returns {Promise<string>} e.g. "iPhone 13 Pro" or "Samsung Galaxy S21"
 */
export const getDeviceInfo = async () => {
  try {
    return (await DeviceInfo.getModel()) || "Unknown Device";
  } catch {
    return "Unknown Device";
  }
};

// ── Error Handling ─────────────────────────────────────────────────────────────

export const getErrorMessage = (error, firstOnly = true) => {
  if (!error) return "Something went wrong";

  const data = error.response?.data;
  
  // Check for the new structured `errors` array from validation
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    // If it's the structured { field, message } format
    if (data.errors[0]?.message) {
      // Just returning the first message, or we could pass the whole array for the screens to parse
      return firstOnly ? data.errors[0].message : data.errors.map(e => e.message).join("\n");
    }
  }

  const apiMessage = data?.message;

  if (apiMessage) {
    if (Array.isArray(apiMessage)) {
      return firstOnly ? apiMessage[0] : apiMessage.join("\n");
    }
    if (typeof apiMessage === "string") return apiMessage;
  }

  return error.message || "Something went wrong";
};

// Add a new utility specifically for extracting structured validation errors
export const getValidationErrors = (error) => {
  const data = error?.response?.data;
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors; // Returns array of { field, message }
  }
  return [];
};

// ── Persisted State ────────────────────────────────────────────────────────────

/**
 * Clear Redux persisted state from AsyncStorage
 */
export const clearPersistedState = async () => {
  try {
    await AsyncStorage.removeItem("persist:root");
  } catch {
    // Silent fail
  }
};

// ── Distance Utilities ─────────────────────────────────────────────────────────

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns {number|null} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} unit - 'Kilometers' or 'Miles'
 * @returns {string} e.g. "800 m", "1.2 km", or "0.7 mi"
 */
export const formatDistance = (distanceKm, unit = "Kilometers") => {
  if (distanceKm == null) return "";

  if (unit === "Miles") {
    const miles = distanceKm * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }

  // Kilometers (default)
  if (distanceKm < 1) return `${(distanceKm * 1000).toFixed(0)} m`;
  return `${distanceKm.toFixed(1)} km`;
};
