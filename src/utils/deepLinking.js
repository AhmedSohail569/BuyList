/**
 * Deep Linking Utilities
 * Handles circle invite deep links, deferred deep linking, and pending invites
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";

// Constants
const PENDING_INVITE_KEY = "@buylist_pending_invite";
const INVITE_URL_PATTERN = /\/invite\/([A-Za-z0-9-_]+)/;

/**
 * Parse invite code from deep link URL
 * Supports formats:
 * - buylist://invite/ABC123
 * - https://buylist.app/invite/ABC123
 * - https://www.buylist.app/invite/ABC123
 */
export const parseInviteLink = (url) => {
    if (!url) return null;

    try {
        // Extract invite code using regex
        const match = url.match(INVITE_URL_PATTERN);
        if (match && match[1]) {
            return match[1];
        }

        // Fallback: try to get code from URL parameters
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get("code");
        if (code) return code;

        return null;
    } catch (err) {
        console.error("Failed to parse invite link:", err);
        return null;
    }
};

/**
 * Store pending invite for new users (deferred deep linking)
 * Called when app is opened via invite link but user is not authenticated
 */
export const storePendingInvite = async (inviteCode) => {
    try {
        if (!inviteCode) return false;

        await AsyncStorage.setItem(
            PENDING_INVITE_KEY,
            JSON.stringify({
                code: inviteCode,
                timestamp: Date.now(),
            }),
        );

        console.log("Stored pending invite:", inviteCode);
        return true;
    } catch (err) {
        console.error("Failed to store pending invite:", err);
        return false;
    }
};

/**
 * Get pending invite (after signup/login)
 * Returns invite code if exists and is not expired (24 hours)
 */
export const getPendingInvite = async () => {
    try {
        const data = await AsyncStorage.getItem(PENDING_INVITE_KEY);
        if (!data) return null;

        const invite = JSON.parse(data);

        // Check if invite is expired (24 hours)
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - invite.timestamp > TWENTY_FOUR_HOURS;

        if (isExpired) {
            await clearPendingInvite();
            return null;
        }

        return invite.code;
    } catch (err) {
        console.error("Failed to get pending invite:", err);
        return null;
    }
};

/**
 * Clear stored pending invite
 */
export const clearPendingInvite = async () => {
    try {
        await AsyncStorage.removeItem(PENDING_INVITE_KEY);
        console.log("Cleared pending invite");
        return true;
    } catch (err) {
        console.error("Failed to clear pending invite:", err);
        return false;
    }
};

/**
 * Generate shareable invite link
 * @param {string} inviteCode - The invite code from backend
 * @param {string} domain - Your domain (e.g., 'buylist.app')
 * @returns {string} - Full invite link
 */
export const generateInviteLink = (inviteCode, domain = "buylist.app") => {
    if (!inviteCode) return "";
    return `https://${domain}/invite/${inviteCode}`;
};

/**
 * Check if URL is an invite link
 */
export const isInviteLink = (url) => {
    if (!url) return false;
    return INVITE_URL_PATTERN.test(url);
};

/**
 * Open app settings (for enabling notifications, etc.)
 */
export const openAppSettings = () => {
    Linking.openSettings().catch((err) => {
        console.error("Failed to open settings:", err);
    });
};

/**
 * Get the initial deep link URL when app is opened
 * Returns null if no deep link
 */
export const getInitialURL = async () => {
    try {
        const url = await Linking.getInitialURL();
        return url;
    } catch (err) {
        console.error("Failed to get initial URL:", err);
        return null;
    }
};
