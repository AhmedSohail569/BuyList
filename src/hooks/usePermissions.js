/**
 * usePermissions Hook
 *
 * Single entry point for all post-login permission flows.
 * Sequences permissions so they NEVER overlap:
 *
 *   1. Notification permission (alert rationale → OS dialog)
 *   2. Location permission (modal → OS dialog)
 *      — only starts AFTER notification flow fully resolves
 *
 * Returns `locationReady` boolean consumed by PermissionsContext
 * so LocationPermissionGate only activates at the right time.
 */

import { useState, useCallback } from "react";
import useNotifications from "./useNotifications";

const usePermissions = () => {
  // locationReady: false until notification flow completes
  const [locationReady, setLocationReady] = useState(false);

  // Called by useNotifications when its flow finishes (any outcome)
  const onNotificationFlowComplete = useCallback(() => {
    console.log("🔔 Notification flow complete — unlocking location permission");
    setLocationReady(true);
  }, []);

  // Start notification flow; it calls onNotificationFlowComplete when done
  useNotifications(onNotificationFlowComplete);

  return { locationReady };
};

export default usePermissions;
