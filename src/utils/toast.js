/**
 * Toast utility for showing simple success/error/info messages
 * Use this instead of Alert.alert for non-blocking notifications
 */
import Toast from "react-native-toast-message";

/**
 * Safely show a toast - wraps in try-catch to prevent TurboModule crashes on iOS
 * @param {object} config - Toast configuration
 */
const safeShowToast = config => {
  try {
    Toast.show(config);
  } catch (error) {
    console.warn("Toast show failed:", error);
  }
};

/**
 * Show a success toast
 * @param {string} title - Main message
 * @param {string} message - Optional secondary message
 */
export const showSuccess = (title, message = "") => {
  safeShowToast({
    type: "success",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

/**
 * Show an error toast
 * @param {string} title - Main message
 * @param {string} message - Optional secondary message
 */
export const showError = (title, message = "") => {
  safeShowToast({
    type: "error",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

/**
 * Show an info toast
 * @param {string} title - Main message
 * @param {string} message - Optional secondary message
 */
export const showInfo = (title, message = "") => {
  safeShowToast({
    type: "info",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

/**
 * Show a warning toast
 * @param {string} title - Main message
 * @param {string} message - Optional secondary message
 */
export const showWarning = (title, message = "") => {
  safeShowToast({
    type: "warning",
    text1: title,
    text2: message,
    position: "top",
    visibilityTime: 3500,
    autoHide: true,
    topOffset: 50,
  });
};

/**
 * Hide any currently visible toast
 */
export const hideToast = () => {
  try {
    Toast.hide();
  } catch (error) {
    console.warn("Toast hide failed:", error);
  }
};

export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  hideToast,
};
