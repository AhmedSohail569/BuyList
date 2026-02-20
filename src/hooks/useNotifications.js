/**
 * useNotifications Hook
 *
 * Handles the full post-login notification lifecycle:
 *  1. Shows a permission rationale alert (only once, using the existing AlertContext)
 *  2. Requests OS notification permission on Allow
 *  3. Retrieves FCM token and syncs it to the backend
 *  4. Subscribes to token refresh and re-syncs automatically
 *  5. Subscribes to foreground messages and shows toasts
 *  6. Cleans up all listeners on unmount
 *
 * @param {() => void} [onComplete] - Called after the permission flow finishes
 *   (whether granted, denied, or skipped). Use this to chain the next permission.
 */

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "~context/AlertContext";
import {
  requestNotificationPermission,
  getFCMToken,
  setupTokenRefreshListener,
  setupForegroundMessageHandler,
} from "~utils/notificationService";
import { syncFCMToken } from "~redux/actions/notificationActions";

// AsyncStorage key — prevents showing the permission dialog on every login
const PERMISSION_ASKED_KEY = "@notification_permission_asked";

const useNotifications = (onComplete) => {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const user = useSelector((state) => state.auth?.user);

  const foregroundUnsubRef  = useRef(null);
  const tokenRefreshUnsubRef = useRef(null);
  // Store callback in ref to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // ─── Token sync ──────────────────────────────────────────────────────────

  const syncToken = useCallback(
    async (token) => {
      if (!token) return;
      try {
        await dispatch(syncFCMToken(token)).unwrap();
      } catch (err) {
        console.warn("⚠️  Token sync failed (non-fatal):", err);
      }
    },
    [dispatch],
  );

  // ─── Core setup ──────────────────────────────────────────────────────────

  const initializeNotifications = useCallback(async () => {
    const token = await getFCMToken();
    console.log("FCM Token:", token);
    await syncToken(token);

    tokenRefreshUnsubRef.current = setupTokenRefreshListener((newToken) => {
      syncToken(newToken);
    });

    foregroundUnsubRef.current = setupForegroundMessageHandler();
  }, [syncToken]);

  // ─── Permission flow ─────────────────────────────────────────────────────

  const runPermissionFlow = useCallback(async () => {
    const alreadyAsked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
    if (alreadyAsked === "true") {
      await initializeNotifications();
      // Flow done — unlock next permission immediately
      onCompleteRef.current?.();
      return;
    }

    showAlert({
      title: "Stay in the Loop 🔔",
      message:
        "Enable notifications to get real-time updates on your shopping lists and circle activity.",
      type: "confirm",
      buttons: [
        {
          text: "Not Now",
          style: "cancel",
          onPress: async () => {
            await AsyncStorage.setItem(PERMISSION_ASKED_KEY, "true");
            onCompleteRef.current?.(); // skipped → unlock location flow
          },
        },
        {
          text: "Allow",
          style: "default",
          onPress: async () => {
            await AsyncStorage.setItem(PERMISSION_ASKED_KEY, "true");
            const granted = await requestNotificationPermission();
            if (granted) {
              await initializeNotifications();
            } else {
              console.log("🔕 Notification permission denied by user");
            }
            onCompleteRef.current?.(); // granted or denied → unlock location flow
          },
        },
      ],
    });
  }, [showAlert, initializeNotifications]);

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    runPermissionFlow();
    return () => {
      foregroundUnsubRef.current?.();
      tokenRefreshUnsubRef.current?.();
    };
  }, [user, runPermissionFlow]);
};

export default useNotifications;
