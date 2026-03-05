/**
 * useOnReconnect Hook
 *
 * Fires a callback when the device transitions from offline → online.
 * Powered by a single shared NetInfo listener (pub-sub) so multiple
 * screens can subscribe without creating duplicate native listeners.
 *
 * Features:
 *  - Debounced (1.5s) to avoid thrashing on flaky connections
 *  - Only fires on genuine offline→online transitions, not on app launch
 *  - Automatically unsubscribes on unmount
 *
 * Usage:
 *   useOnReconnect(() => {
 *     dispatch(fetchAllLists());
 *   });
 */
import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

// ── Shared global NetInfo listener (pub-sub) ───────────────────────────────────

const subscribers = new Set();
let wasOffline = false;
let hasInitialized = false;
let debounceTimer = null;

const RECONNECT_DEBOUNCE_MS = 1500;

// Single global listener — lives for the app's lifetime, never unsubscribed.
// We intentionally discard the unsubscribe fn since this is app-level infrastructure.
/* eslint-disable-next-line no-unused-vars */
const _unsubscribeNetInfo = NetInfo.addEventListener((state) => {
  const isConnected = state.isConnected && state.isInternetReachable !== false;

  if (!hasInitialized) {
    // First event — just record the initial state, don't fire callbacks
    wasOffline = !isConnected;
    hasInitialized = true;
    return;
  }

  if (!isConnected) {
    // Device went offline — record it
    wasOffline = true;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    return;
  }

  if (wasOffline && isConnected) {
    // Offline → Online transition — debounce then notify all subscribers
    wasOffline = false;

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      subscribers.forEach((callback) => {
        try {
          callback();
        } catch {
          // Silently catch errors in individual callbacks
        }
      });
    }, RECONNECT_DEBOUNCE_MS);
  }
});

// ── Hook ────────────────────────────────────────────────────────────────────────

const useOnReconnect = (callback) => {
  const callbackRef = useRef(callback);

  // Always keep the ref up-to-date so the latest closure is called
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = () => callbackRef.current?.();
    subscribers.add(handler);

    return () => {
      subscribers.delete(handler);
    };
  }, []);
};

export default useOnReconnect;
