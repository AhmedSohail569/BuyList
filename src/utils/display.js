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
 * Converts a raw action type + metadata into a translated sentence fragment.
 * Returns a fallback English string when t is not provided.
 *
 * @param {string} action
 * @param {object} metadata
 * @param {Function} [t] - translation function from useTranslation()
 * @returns {string}
 */
export const formatActivityAction = (action, metadata, t) => {
  const itemCount = metadata?.itemCount || 1;

  // Helper: safely call t() or fall back to the English default
  const tr = (key, fallback, params) => {
    if (!t) return fallback;
    const raw = t(key);
    if (!params || raw === key) return raw !== key ? raw : fallback;
    // Simple {{placeholder}} interpolation
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v),
      raw
    );
  };

  switch (action) {
    case "PURCHASE_ITEMS": {
      const noun =
        itemCount === 1
          ? tr("activity_item", "item")
          : tr("activity_items", "items");
      return tr(
        "activity_purchase_items",
        `marked ${itemCount} ${noun} as purchased`,
        { count: itemCount, noun }
      );
    }
    case "ADD_ITEMS": {
      const noun =
        itemCount === 1
          ? tr("activity_item", "item")
          : tr("activity_items", "items");
      return tr("activity_add_items", `added ${itemCount} ${noun}`, {
        count: itemCount,
        noun,
      });
    }
    case "CREATE_LIST":
      return tr("activity_create_list", "created a list");
    case "DELETE_LIST":
      return tr("activity_delete_list", "deleted a list");
    case "JOIN_CIRCLE":
      return tr("activity_join_circle", "joined the circle");
    case "LEAVE_CIRCLE":
      return tr("activity_leave_circle", "left the circle");
    default:
      return tr("activity_default", "updated the circle");
  }
};

/**
 * Normalises a raw activity record into a flat display object.
 * Pass t() from useTranslation() to get translated action strings.
 *
 * @param {object} activity
 * @param {number} index  - fallback key
 * @param {Function} [t] - translation function from useTranslation()
 * @returns {{ id, userName, userAvatar, actionText, targetText, timeText }}
 */
export const normalizeActivity = (activity, index, t) => {
  const id = activity?._id || activity?.id || String(index);
  const actor = activity?.actor || {};
  const someone = t ? t("activity_someone") : "Someone";
  const userName = actor?.username || activity?.username || someone;
  const userAvatar = actor?.profilePicture || actor?.avatar || "";
  const actionType = activity?.action || "";
  const metadata = activity?.metadata || {};
  const actionText = formatActivityAction(actionType, metadata, t);
  const listObj = activity?.list || {};
  const targetText = listObj?.name || metadata?.listName || "";
  const createdAt = activity?.createdAt || activity?.updatedAt;
  const timeText = createdAt ? formatTimeAgo(createdAt) : "";

  return { id, userName, userAvatar, actionText, targetText, timeText };
};
