/**
 * Firebase Configuration & Initialization
 *
 * This module centralises all Firebase service references.
 * Import from here instead of directly from @react-native-firebase packages
 * so that initialisation is always consistent across the app.
 */

import app from "@react-native-firebase/app";
import messaging from "@react-native-firebase/messaging";

/**
 * Returns the singleton Firebase App instance.
 * @react-native-firebase auto-initialises from google-services.json (Android)
 * and GoogleService-Info.plist (iOS), so no manual config object is needed.
 */
export const getFirebaseApp = () => app();

/**
 * Returns the Firebase Cloud Messaging instance.
 * Use this to request permissions, get tokens, and subscribe to messages.
 */
export const getMessaging = () => messaging();

export default { getFirebaseApp, getMessaging };
