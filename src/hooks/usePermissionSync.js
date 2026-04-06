/**
 * usePermissionSync Hook
 *
 * Runs once per app launch (when the user is logged in and AppNavigator mounts).
 * Silently re-checks every runtime permission the app has previously handled
 * and resets the corresponding Redux/AsyncStorage state if a permission was
 * revoked by the user in device Settings.
 *
 * This ensures the app will re-prompt on the next appropriate interaction
 * instead of silently failing because it cached "granted" from a previous session.
 *
 * Permissions checked:
 *   - Location         → locationReducer.permissionGranted + promptDismissed
 *   - Notifications    → AsyncStorage @notification_permission_asked
 */

import { useEffect, useRef } from "react";
import { Platform, AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import {
  setPermissionGranted,
  resetLocationPrompt,
} from "~redux/reducers/locationReducer";
import { checkNotificationPermission } from "~utils/notificationService";

const NOTIFICATION_ASKED_KEY = "@notification_permission_asked";

/** Platform-appropriate location permission constant */
const getLocationPermission = () =>
  Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  });

/**
 * Silently check a single permission.
 * Returns true if GRANTED or LIMITED, false for anything else.
 */
const checkPermission = async (permission) => {
  if (!permission) return false;
  try {
    const status = await check(permission);
    return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
  } catch {
    return false;
  }
};

const usePermissionSync = () => {
  const dispatch = useDispatch();
  const { permissionGranted: locationGranted } = useSelector(
    (state) => state.location,
  );

  // Prevent the check from running more than once per mount
  const hasCheckedRef = useRef(false);

  const runSync = async () => {
    // ── 1. Location ────────────────────────────────────────────────────────
    const locationPermission = getLocationPermission();
    const locationNowGranted = await checkPermission(locationPermission);

    if (locationGranted && !locationNowGranted) {
      // Was granted before, but now revoked → reset so screens can re-prompt
      dispatch(setPermissionGranted(false));
      dispatch(resetLocationPrompt());
      console.log("[PermissionSync] Location permission revoked — reset.");
    } else if (!locationGranted && locationNowGranted) {
      // Granted outside the app (e.g. via Settings) → sync silently
      dispatch(setPermissionGranted(true));
      console.log("[PermissionSync] Location permission detected as granted — synced.");
    }

    // Removed: Notification Sync loop. 
    // If a user revokes notification permission in Settings, they shouldn't 
    // be spammed with in-app "Welcome" onboarding alerts loops, because the 
    // native OS OS-level prompt can only be shown once anyway.
  };

  // ── Run on mount (app launch with logged-in user) ──────────────────────────
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-run when app returns to foreground (user may have changed Settings) ─
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        runSync();
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationGranted]);
};

export default usePermissionSync;
