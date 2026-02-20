/**
 * Notification Service
 *
 * Centralised module for all Firebase Cloud Messaging (FCM) logic.
 *
 * ⚠️  Key API note for @react-native-firebase/messaging:
 *   - messaging()            → returns the module instance (for instance methods)
 *   - messaging.AuthorizationStatus → STATIC enum on the module, NOT on the instance
 *   - messaging.setBackgroundMessageHandler → STATIC method on the module
 */

import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { showInfo } from "./toast";

// ─────────────────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Requests OS-level notification permission.
 *
 * On iOS: triggers the native system prompt (shown only once by the OS).
 * On Android 13+ (API 33): triggers POST_NOTIFICATIONS runtime permission.
 * On Android < 13: permission is granted automatically, returns AUTHORIZED.
 *
 * @returns {Promise<boolean>} true if permission is granted, false otherwise
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      // Android 13+ (API 33) requires POST_NOTIFICATIONS runtime permission.
      // Use React Native's built-in PermissionsAndroid to avoid null constant issues
      // with react-native-permissions on some build configurations.
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message: "BuyList needs permission to send you notifications about your lists and circle activity.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );
        const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log("🔔 Android POST_NOTIFICATIONS:", result, "| Granted:", isGranted);
        return isGranted;
      }
      // Android < 13: POST_NOTIFICATIONS doesn't exist — auto-granted by default.
      console.log("🔔 Android < 13: notifications auto-granted");
      return true;
    }

    // iOS: Firebase's requestPermission() correctly triggers the native prompt.
    const authStatus = await messaging().requestPermission();
    const isGranted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log("🔔 iOS notification permission:", authStatus, "| Granted:", isGranted);
    return isGranted;
  } catch (error) {
    console.error("❌ Error requesting notification permission:", error);
    return false;
  }
};

/**
 * Checks current notification permission without prompting.
 * @returns {Promise<boolean>}
 */
export const checkNotificationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true; // Auto-granted on Android < 13
    }

    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error("❌ Error checking notification permission:", error);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FCM Token
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves the current FCM registration token for this device.
 * Must be called AFTER notification permission is granted.
 *
 * @returns {Promise<string|null>} The FCM token, or null on failure
 */
export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log("📲 FCM Token retrieved:", token ? `${token.substring(0, 20)}...` : "null");
    return token || null;
  } catch (error) {
    console.error("❌ Error getting FCM token:", error);
    return null;
  }
};

/**
 * Subscribes to FCM token refresh events.
 * When the token rotates (device restore, app reinstall, etc.),
 * the callback receives the new token so it can be synced to the backend.
 *
 * @param {(newToken: string) => void} onRefresh - Callback with the new token
 * @returns {() => void} Unsubscribe function — call on component unmount
 */
export const setupTokenRefreshListener = (onRefresh) => {
  const unsubscribe = messaging().onTokenRefresh((newToken) => {
    console.log("🔄 FCM Token refreshed:", newToken ? `${newToken.substring(0, 20)}...` : "null");
    if (newToken && typeof onRefresh === "function") {
      onRefresh(newToken);
    }
  });

  return unsubscribe;
};

// ─────────────────────────────────────────────────────────────────────────────
// Message Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles notifications received while the app is in the FOREGROUND.
 * React Native Firebase does NOT show a notification banner by default in
 * foreground — we display a toast instead for a non-intrusive experience.
 *
 * @returns {() => void} Unsubscribe function — call on component unmount
 */
export const setupForegroundMessageHandler = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("📨 Foreground FCM message:", remoteMessage);

    const title = remoteMessage?.notification?.title || "BuyList";
    const body  = remoteMessage?.notification?.body  || "You have a new notification";

    // Show toast as in-app notification banner
    showInfo(title, body);
  });

  return unsubscribe;
};

/**
 * Registers the BACKGROUND / QUIT-STATE message handler.
 *
 * ⚠️  MUST be called at the top of index.js (before React registers the app)
 *     so it is available even when the app process is triggered by a push.
 *
 * setBackgroundMessageHandler is a STATIC method — called on the module, not the instance.
 * Background handler cannot update UI — use it for data processing only.
 */
export const registerBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("📭 Background FCM message:", remoteMessage);
    // Background-safe work only: no setState, no navigation.
    // The OS displays the notification automatically from the FCM payload.
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the APNS (Apple Push Notification Service) token for iOS.
 * Required for some backend implementations that target APNs directly.
 * Returns null on Android.
 *
 * @returns {Promise<string|null>}
 */
export const getAPNSToken = async () => {
  if (Platform.OS !== "ios") return null;
  try {
    return await messaging().getAPNSToken();
  } catch (error) {
    console.error("❌ Error getting APNS token:", error);
    return null;
  }
};
