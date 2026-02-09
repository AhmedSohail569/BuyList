import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeAccessToken = async token => {
  try {
    if (token) {
      await AsyncStorage.setItem("accessToken", token);
      console.log("✅ Access token saved to AsyncStorage");
    }
  } catch (error) {
    console.log("❌ Error saving access token:", error);
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem("accessToken");
  } catch (err) {
    console.log("❌ Error getting token:", err);
    return null;
  }
};

export const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem("accessToken");
  } catch (err) {
    console.log("❌ Error removing token:", err);
  }
};

export const getErrorMessage = (error, firstOnly = true) => {
  if (!error) return "Something went wrong";

  const apiMessage = error.response?.data?.message;

  if (apiMessage) {
    if (Array.isArray(apiMessage)) {
      return firstOnly ? apiMessage[0] : apiMessage.join("\n");
    }
    if (typeof apiMessage === "string") return apiMessage;
  }

  return error.message || "Something went wrong";
};

/**
 * Clear Redux persisted state from AsyncStorage
 * Use this if you encounter state structure errors
 */
export const clearPersistedState = async () => {
  try {
    await AsyncStorage.removeItem("persist:root");
    console.log("✅ Persisted state cleared");
  } catch (error) {
    console.log("❌ Error clearing persisted state:", error);
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string (e.g., "0.8 km", "1.2 km")
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm == null) return "";
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};
