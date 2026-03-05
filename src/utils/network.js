/**
 * Network Connectivity Utility
 * Checks internet connectivity using @react-native-community/netinfo
 * and shows a cooldown-protected toast when offline.
 */
import NetInfo from "@react-native-community/netinfo";
import { InteractionManager } from "react-native";
import { showError } from "~utils/toast";

// ── Cooldown to prevent toast spam ─────────────────────────────────────────────

let lastOfflineToastTime = 0;
const OFFLINE_TOAST_COOLDOWN = 5000; // 5 seconds

/**
 * Check if the device is currently connected to the internet.
 * @returns {Promise<boolean>} true if connected, false otherwise
 */
export const checkConnectivity = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch {
    // If NetInfo itself fails, assume connected and let the request proceed
    return true;
  }
};

/**
 * Show a "No Internet" toast with cooldown to prevent spamming.
 */
export const showNoInternetToast = () => {
  const now = Date.now();
  if (now - lastOfflineToastTime > OFFLINE_TOAST_COOLDOWN) {
    lastOfflineToastTime = now;
    InteractionManager.runAfterInteractions(() => {
      showError(
        "No Internet Connection",
        "Please check your connection and try again.",
      );
    });
  }
};

/**
 * RTK createAsyncThunk `condition` callback.
 * Prevents the thunk (and its pending action / optimistic updates) from firing
 * when the device is offline.
 *
 * Usage:
 *   createAsyncThunk("slice/action", payloadCreator, {
 *     condition: requireConnectivity,
 *   })
 *
 * @returns {Promise<boolean>} false cancels the thunk entirely
 */
export const requireConnectivity = async () => {
  const connected = await checkConnectivity();
  if (!connected) {
    showNoInternetToast();
    return false;
  }
  return true;
};
