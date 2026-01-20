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
