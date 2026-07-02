/**
 * Theme Colors - Centralized color definitions for light and dark modes
 * Based on the dark mode reference screenshot for exact color matching
 */

// Shared colors that don't change between themes
const sharedColors = {
  // Brand colors
  primary: "#1E9DF1",
  primaryLight: "#DBEAFE",
  primaryDark: "#0284C7",

  // Status colors
  success: "#22C55E",
  successLight: "#DCFCE7",
  successDark: "#16A34A",

  warning: "#F97316",
  warningLight: "#FFEDD5",
  warningDark: "#EA580C",

  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorDark: "#DC2626",

  // Accent colors for quick actions
  purple: "#9333EA",
  purpleLight: "#F3E8FF",
  orange: "#EA580C",
  orangeLight: "#FFEDD5",
  green: "#16A34A",
  greenLight: "#DCFCE7",
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  pink: "#EC4899",
  indigo: "#6366F1",
  cyan: "#14B8A6",
  yellow: "#EAB308",

  // Transparent
  transparent: "transparent",
};

// Light theme colors
export const lightColors = {
  ...sharedColors,

  // Backgrounds
  background: "#F9FAFB",
  backgroundSecondary: "#F3F4F6",
  surface: "#FFFFFF",
  surfaceSecondary: "#F9FAFB",

  // Cards
  card: "#FFFFFF",
  cardSecondary: "#F9FAFB",
  cardElevated: "#FFFFFF",

  // Text colors
  textPrimary: "#1B1A1F",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textDisabled: "#D1D5DB",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  borderFocus: "#1E9DF1",

  // Icons
  icon: "#1B1A1F",
  iconSecondary: "#6B7280",
  iconMuted: "#9CA3AF",
  iconDisabled: "#D1D5DB",

  // Input
  inputBackground: "#FFFFFF",
  inputBorder: "#E5E7EB",
  inputText: "#111827",
  inputPlaceholder: "#9AA0A6",
  inputDisabled: "#F3F4F6",

  // Tab bar
  tabBar: "#FFFFFF",
  tabBarBorder: "#E5E7EB",
  tabActive: "#2F80ED",
  tabInactive: "#9CA3AF",

  // Header
  headerBackground: "#FFFFFF",
  headerBorder: "rgba(0, 0, 0, 0.05)",
  headerText: "#1B1A1F",

  // Shadows
  shadowColor: "#000000",
  shadowOpacity: 0.08,

  // Divider
  divider: "#F3F4F6",

  // Modal/Bottom sheet
  modalBackground: "#FFFFFF",
  modalOverlay: "rgba(0, 0, 0, 0.5)",

  // Badges
  badgeBackground: "#E0F2FE",
  badgeText: "#0284C7",

  // Status bar
  statusBarStyle: "dark-content",

  // Progress bar
  progressTrack: "#F3F4F6",
  progressFill: "#0EA5E9",

  // List item
  listItemBackground: "#FFFFFF",
  listItemPressed: "#F3F4F6",

  // Logout button
  logoutBackground: "#FEF2F2",
  logoutBorder: "#FEE2E2",
  logoutText: "#EF4444",

  // Notification badge
  notificationBadge: "#EF4444",

  // Avatar
  avatarBackground: "#E5E7EB",
  avatarBorder: "#FFFFFF",

  // Store card
  storeCardBadgeHighStock: "#16A34A",
  storeCardBadgeLowTraffic: "#0EA5E9",

  // Profile card
  profileCardBackground: "#F9FAFB",
  profileCardBorder: "#F3F4F6",

  // Message chat
  msgMyBubble: "rgba(224, 242, 254, 1)",   // light blue bubble (me)
  msgMyName: "rgba(3, 105, 161, 1)",        // dark blue name label
  msgMyText: "rgba(30, 58, 138, 1)",        // navy blue message text
  msgOtherText: "rgba(75, 85, 99, 1)",      // dark gray text for others
  msgTimestamp: "rgba(156, 163, 175, 1)",   // muted gray timestamp
};

// Dark theme colors - Based on reference screenshot
export const darkColors = {
  ...sharedColors,

  // Backgrounds - Dark navy/charcoal from screenshot
  background: "#0F172A",
  backgroundSecondary: "#1E293B",
  surface: "#1E293B",
  surfaceSecondary: "#334155",

  // Cards - Slightly lighter than background
  card: "#1E293B",
  cardSecondary: "#334155",
  cardElevated: "#2D3B4F",

  // Text colors - High contrast for dark mode
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textDisabled: "#64748B",
  textInverse: "#0F172A",

  // Borders - Subtle on dark
  border: "#334155",
  borderLight: "#1E293B",
  borderFocus: "#1E9DF1",

  // Icons
  icon: "#F8FAFC",
  iconSecondary: "#CBD5E1",
  iconMuted: "#94A3B8",
  iconDisabled: "#64748B",

  // Input
  inputBackground: "#1E293B",
  inputBorder: "#334155",
  inputText: "#F8FAFC",
  inputPlaceholder: "#64748B",
  inputDisabled: "#334155",

  // Tab bar - Dark from screenshot
  tabBar: "#1E293B",
  tabBarBorder: "#334155",
  tabActive: "#1E9DF1",
  tabInactive: "#64748B",

  // Header - Dark navy from screenshot
  headerBackground: "#0F172A",
  headerBorder: "rgba(255, 255, 255, 0.1)",
  headerText: "#F8FAFC",

  // Shadows - Adjusted for dark mode (more subtle)
  shadowColor: "#000000",
  shadowOpacity: 0.3,

  // Divider
  divider: "#334155",

  // Modal/Bottom sheet
  modalBackground: "#1E293B",
  modalOverlay: "rgba(0, 0, 0, 0.7)",

  // Badges
  badgeBackground: "rgba(30, 157, 241, 0.2)",
  badgeText: "#60A5FA",

  // Status bar
  statusBarStyle: "light-content",

  // Progress bar
  progressTrack: "#334155",
  progressFill: "#1E9DF1",

  // List item
  listItemBackground: "#1E293B",
  listItemPressed: "#334155",

  // Logout button
  logoutBackground: "rgba(239, 68, 68, 0.15)",
  logoutBorder: "rgba(239, 68, 68, 0.3)",
  logoutText: "#F87171",

  // Notification badge
  notificationBadge: "#EF4444",

  // Avatar
  avatarBackground: "#334155",
  avatarBorder: "#1E293B",

  // Store card
  storeCardBadgeHighStock: "#22C55E",
  storeCardBadgeLowTraffic: "#0EA5E9",

  // Profile card
  profileCardBackground: "#1E293B",
  profileCardBorder: "#334155",

  // Message chat
  msgMyBubble: "rgba(30, 58, 138, 0.25)",  // muted dark blue bubble (me)
  msgMyName: "#60A5FA",                     // lighter blue name label
  msgMyText: "#93C5FD",                     // light blue message text
  msgOtherText: "#CBD5E1",                  // light gray text for others
  msgTimestamp: "#64748B",                  // muted slate timestamp
};

// Theme type definitions
export const ThemeType = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

// Get colors based on theme
export const getColors = isDark => (isDark ? darkColors : lightColors);

export default {
  light: lightColors,
  dark: darkColors,
  shared: sharedColors,
};
