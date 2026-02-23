/**
 * Notification Service
 *
 * Centralised module for all Firebase Cloud Messaging (FCM) logic.
 *
 * API notes for @react-native-firebase/messaging:
 *   - messaging()            → instance (for instance methods)
 *   - messaging.AuthorizationStatus → STATIC enum on the module
 *   - messaging.setBackgroundMessageHandler → STATIC method on the module
 */
import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { showInfo } from "./toast";

// ── Permission ─────────────────────────────────────────────────────────────────

/**
 * Request OS-level notification permission.
 * iOS: triggers native prompt (shown once by OS).
 * Android 13+: triggers POST_NOTIFICATIONS runtime permission.
 * Android < 13: auto-granted.
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message:
              "BuyList needs permission to send you notifications about your lists and circle activity.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }

    // iOS
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

/**
 * Check current notification permission without prompting.
 * @returns {Promise<boolean>}
 */
export const checkNotificationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true;
    }

    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

// ── FCM Token ──────────────────────────────────────────────────────────────────

/**
 * Retrieve FCM registration token. Must be called after permission is granted.
 * @returns {Promise<string|null>}
 */
export const getFCMToken = async () => {
  try {
    return (await messaging().getToken()) || null;
  } catch {
    return null;
  }
};

/**
 * Subscribe to FCM token refresh events.
 * @param {(newToken: string) => void} onRefresh
 * @returns {() => void} Unsubscribe function
 */
export const setupTokenRefreshListener = (onRefresh) => {
  return messaging().onTokenRefresh((newToken) => {
    if (newToken && typeof onRefresh === "function") {
      onRefresh(newToken);
    }
  });
};

// ── Message Handlers ───────────────────────────────────────────────────────────

/**
 * Handle notifications in FOREGROUND — shows a toast banner.
 * @returns {() => void} Unsubscribe function
 */
export const setupForegroundMessageHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage?.notification?.title || "BuyList";
    const body = remoteMessage?.notification?.body || "You have a new notification";
    showInfo(title, body);
  });
};

/**
 * Register BACKGROUND / QUIT-STATE message handler.
 * Must be called at the top of index.js (before AppRegistry).
 */
export const registerBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async () => {
    // Background-safe work only. OS shows notification from FCM payload.
  });
};

// ── Platform Helpers ───────────────────────────────────────────────────────────

/**
 * Get APNS token for iOS (null on Android).
 * @returns {Promise<string|null>}
 */
export const getAPNSToken = async () => {
  if (Platform.OS !== "ios") return null;
  try {
    return await messaging().getAPNSToken();
  } catch {
    return null;
  }
};
