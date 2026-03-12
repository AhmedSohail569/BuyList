/**
 * Display / user-facing formatting utilities
 *
 * Covers:
 *  - Avatar helpers (initials, profile picture presence check)
 *  - Activity feed normalisation
 */

// ── Avatar helpers ────────────────────────────────────────────────────────────

/**
 * Returns up-to-2-character initials from a user's name.
 * - Single name  → first 2 letters  ("Ahmed" → "AH")
 * - Multiple names → first + last initial  ("John Doe" → "JD")
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Returns true when a profile picture URL is usable (non-empty string).
 * @param {string|null|undefined} profilePicture
 * @returns {boolean}
 */
export const hasProfilePicture = (profilePicture) =>
  Boolean(profilePicture && profilePicture.trim() !== "");

// ── Activity feed helpers ─────────────────────────────────────────────────────

import { formatTimeAgo } from "./time";

/**
 * Converts a raw action type + metadata into a readable sentence fragment.
 * e.g. "PURCHASE_ITEMS" → "marked 3 items as purchased"
 */
export const formatActivityAction = (action, metadata) => {
  const itemCount = metadata?.itemCount || 1;
  switch (action) {
    case "PURCHASE_ITEMS":
      return `marked ${itemCount} ${itemCount === 1 ? "item" : "items"} as purchased`;
    case "ADD_ITEMS":
      return `added ${itemCount} ${itemCount === 1 ? "item" : "items"}`;
    case "CREATE_LIST":
      return "created a list";
    case "DELETE_LIST":
      return "deleted a list";
    case "JOIN_CIRCLE":
      return "joined the circle";
    case "LEAVE_CIRCLE":
      return "left the circle";
    default:
      return "updated the circle";
  }
};

/**
 * Normalises a raw activity record into a flat display object.
 * @param {object} activity
 * @param {number} index  - fallback key
 * @returns {{ id, userName, userAvatar, actionText, targetText, timeText }}
 */
export const normalizeActivity = (activity, index) => {
  const id = activity?._id || activity?.id || String(index);
  const actor = activity?.actor || {};
  const userName = actor?.username || activity?.username || "Someone";
  const userAvatar = actor?.profilePicture || actor?.avatar || "";
  const actionType = activity?.action || "";
  const metadata = activity?.metadata || {};
  const actionText = formatActivityAction(actionType, metadata);
  const listObj = activity?.list || {};
  const targetText = listObj?.name || metadata?.listName || "";
  const createdAt = activity?.createdAt || activity?.updatedAt;
  const timeText = createdAt ? formatTimeAgo(createdAt) : "";

  return { id, userName, userAvatar, actionText, targetText, timeText };
};
