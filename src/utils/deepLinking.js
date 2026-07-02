/**
 * Deep Linking Utilities
 * Handles circle invite deep links, deferred deep linking, and pending invites.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Linking} from "react-native";

// Constants
const PENDING_INVITE_KEY = "@bagg_pending_invite";
const INVITE_URL_PATTERN = /\/invite\/([A-Za-z0-9-_]+)/;

/**
 * Parse invite code from deep link URL.
 * Supports:
 *   bagg://invite/ABC123
 *   https://getbagg.com/invite/ABC123
 *   https://www.getbagg.com/invite/ABC123
 */
export const parseInviteLink = url => {
  if (!url) return null;
  try {
    const match = url.match(INVITE_URL_PATTERN);
    if (match?.[1]) return match[1];

    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    return code || null;
  } catch {
    return null;
  }
};

/**
 * Store pending invite for unauthenticated users (deferred deep linking).
 */
export const storePendingInvite = async inviteCode => {
  try {
    if (!inviteCode) return false;
    await AsyncStorage.setItem(
      PENDING_INVITE_KEY,
      JSON.stringify({code: inviteCode, timestamp: Date.now()}),
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Get pending invite (after signup/login).
 * Returns invite code if it exists and hasn't expired (24 hours).
 */
export const getPendingInvite = async () => {
  try {
    const data = await AsyncStorage.getItem(PENDING_INVITE_KEY);
    if (!data) return null;

    const invite = JSON.parse(data);
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (Date.now() - invite.timestamp > TWENTY_FOUR_HOURS) {
      await clearPendingInvite();
      return null;
    }
    return invite.code;
  } catch {
    return null;
  }
};

/**
 * Clear stored pending invite.
 */
export const clearPendingInvite = async () => {
  try {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate a shareable invite link.
 */
export const generateInviteLink = (inviteCode, domain = "getbagg.com") => {
  if (!inviteCode) return "";
  return `https://${domain}/invite/${inviteCode}`;
};

/**
 * Check whether a URL is an invite link.
 */
export const isInviteLink = url => {
  if (!url) return false;
  return INVITE_URL_PATTERN.test(url);
};

/**
 * Open the device settings for this app.
 */
export const openAppSettings = () => {
  Linking.openSettings().catch(() => {});
};
