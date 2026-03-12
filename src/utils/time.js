/**
 * Time formatting utilities
 * Centralised here to avoid duplicating timeago logic across screens.
 */

/**
 * Returns a human-readable "time ago" string.
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} e.g. "5m ago", "3h ago", "2d ago"
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const now = Date.now();
  const diffMs = now - new Date(dateString).getTime();
  if (Number.isNaN(diffMs)) return "";

  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

/**
 * Like formatTimeAgo but returns "Updated X ago" prefix for lists.
 * @param {string|Date} dateString
 * @returns {string} e.g. "Updated 2h ago"
 */
export const formatListTimeAgo = (dateString) => {
  if (!dateString) return "Updated recently";
  const result = formatTimeAgo(dateString);
  if (!result || result === "Just now") return "Updated just now";
  return `Updated ${result}`;
};
