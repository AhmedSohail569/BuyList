import { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Lock,
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import Header from "~components/Header";
import { ScrollView, Text, Alert as CustomAlert } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import {
  getSessions,
  logoutSession,
  logoutAllOtherSessions,
} from "~redux/actions/sessionActions";
import { logoutAllAndPurge } from "~redux/store";
import useOnReconnect from "~hooks/useOnReconnect";
import useTranslation from "~hooks/useTranslation";

// ── Reusable Rows ──────────────────────────────────────────────────────────────

const SecurityRow = ({
  icon: Icon,
  color,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast,
  colors,
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
    style={[
      styles.rowContainer,
      { backgroundColor: colors.card },
      !isLast && [styles.separator, { borderBottomColor: colors.divider }],
    ]}>
    <View style={[styles.iconBox, { backgroundColor: color }]}>
      <Icon size={RFValue(18)} color={getIconColor(color)} strokeWidth={1.5} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
    <View style={styles.rightContainer}>
      {rightElement || <ChevronRight size={RFValue(16)} color={colors.iconMuted} />}
    </View>
  </TouchableOpacity>
);

const SessionRow = ({
  t,
  icon: Icon,
  device,
  location,
  isCurrent,
  onLogout,
  isLast,
  colors,
  loading,
}) => (
  <View
    style={[
      styles.rowContainer,
      { backgroundColor: colors.card },
      !isLast && [styles.separator, { borderBottomColor: colors.divider }],
    ]}>
    <View style={styles.deviceIconBox}>
      <Icon
        size={RFValue(20)}
        color={isCurrent ? colors.primary : colors.iconSecondary}
        strokeWidth={1.5}
      />
    </View>
    <View style={styles.textContainer}>
      <View style={styles.deviceHeader}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {device}
        </Text>
        {/* {isCurrent && (
          <View style={[styles.currentBadge, { backgroundColor: colors.badgeBackground }]}>
            <Text style={[styles.currentBadgeText, { color: colors.badgeText }]}>{t("security_current")}</Text>
          </View>
        )} */}
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{location}</Text>
    </View>
    {isCurrent ? (
      <View style={[styles.currentBadge, { backgroundColor: colors.badgeBackground }]}>
        <Text style={[styles.currentBadgeText, { color: colors.badgeText }]}>{t("security_current")}</Text>
      </View>
    ) : (
      <TouchableOpacity
        style={[styles.logoutSmallBtn, { borderColor: colors.logoutBorder }]}
        onPress={onLogout}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.error} />
        ) : (
          <Text style={[styles.logoutSmallText, { color: colors.error }]}>{t("security_log_out")}</Text>
        )}
      </TouchableOpacity>
    )}
  </View>
);

// ── Helpers ─────────────────────────────────────────────────────────────────────

const getDeviceIcon = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
    case "phone":
      return Smartphone;
    case "tablet":
      return Tablet;
    case "desktop":
      return Monitor;
    case "laptop":
      return Laptop;
    default:
      return Smartphone;
  }
};

const getIconColor = (bgColor) => {
  if (bgColor === "#e0f2fe" || bgColor === "rgba(14, 165, 233, 0.2)") return "#0ea5e9";
  if (bgColor === "#dcfce7" || bgColor === "rgba(34, 197, 94, 0.2)") return "#22c55e";
  return "#6b7280";
};

const formatLastActive = (lastActive) => {
  if (!lastActive) return "Unknown";

  const diffMs = Date.now() - new Date(lastActive).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Active now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

// ── Main Component ──────────────────────────────────────────────────────────────

const SecurityScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "confirm",
    buttons: [],
  });

  const {
    sessions,
    loading,
    logoutSessionLoading,
    logoutOtherLoading,
    logoutAllLoading,
  } = useSelector((state) => state.session);

  useEffect(() => {
    dispatch(getSessions());
  }, [dispatch]);

  // Re-fetch sessions when internet reconnects
  useOnReconnect(() => {
    dispatch(getSessions());
  });

  const closeAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Logout a single (other) session
  const handleLogoutSession = useCallback(
    (sessionId, deviceName) => {
      setAlertConfig({
        visible: true,
        title: t("security_end_session_title"),
        message: `${t("security_end_session_message")} ${deviceName}?`,
        type: "confirm",
        buttons: [
          { text: t("security_cancel"), style: "cancel", onPress: closeAlert },
          {
            text: t("security_logout"),
            style: "destructive",
            onPress: () => {
              dispatch(logoutSession({ sessionId }));
              closeAlert();
            },
          },
        ],
      });
    },
    [dispatch, closeAlert],
  );

  // Logout all other sessions (keep current)
  const handleLogoutOthers = useCallback(() => {
    if (sessions.length <= 1) return;

    setAlertConfig({
      visible: true,
      title: t("security_logout_other_title"),
      message: t("security_logout_other_message"),
      type: "warning",
      buttons: [
        { text: t("security_cancel"), style: "cancel", onPress: closeAlert },
        {
          text: t("security_logout"),
          style: "destructive",
          onPress: () => {
            dispatch(logoutAllOtherSessions());
            closeAlert();
          },
        },
      ],
    });
  }, [sessions.length, dispatch, closeAlert]);

  // Logout ALL sessions (including current device — graceful)
  const handleLogoutAll = useCallback(() => {
    setAlertConfig({
      visible: true,
      title: t("security_logout_all_title"),
      message: t("security_logout_all_message"),
      type: "error",
      buttons: [
        { text: t("security_cancel"), style: "cancel", onPress: closeAlert },
        {
          text: t("security_logout"),
          style: "destructive",
          onPress: async () => {
            closeAlert();
            try {
              // Server invalidates every session, then local state is wiped
              await logoutAllAndPurge();
            } catch {
              // logoutAllAndPurge already shows a toast on server error
            }
          },
        },
      ],
    });
  }, [closeAlert]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header variant="screen" title={t("security_title")} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ACTIVE SESSIONS */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t("security_section_sessions")}</Text>

        {loading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t("security_loading")}
            </Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("security_no_sessions")}
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
            {sessions.map((session, index) => (
              <SessionRow
                t={t}
                key={session.id}
                icon={getDeviceIcon(session.deviceType)}
                device={session.deviceName || session.browser || "Unknown Device"}
                location={`${session.location || "Unknown"} • ${session.isCurrent ? "Active Now" : formatLastActive(session.lastUsedAt)}`}
                isCurrent={session.isCurrent}
                isLast={index === sessions.length - 1}
                onLogout={() => handleLogoutSession(session.id, session.deviceName)}
                colors={colors}
                loading={logoutSessionLoading}
              />
            ))}
          </View>
        )}

        {/* SESSION ACTIONS */}
        {sessions.length > 1 && (
          <TouchableOpacity
            style={[styles.signOutButton, { borderColor: colors.logoutBorder }]}
            onPress={handleLogoutOthers}
            disabled={logoutOtherLoading}>
            {logoutOtherLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <LogOut size={RFValue(16)} color={colors.error} style={styles.actionIcon} />
                <Text style={[styles.signOutText, { color: colors.error }]}>
                  {t("security_logout_other")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {sessions.length > 0 && (
          <TouchableOpacity
            style={[styles.signOutAllButton, { borderColor: colors.logoutBorder }]}
            onPress={handleLogoutAll}
            disabled={logoutAllLoading}>
            {logoutAllLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <LogOut size={RFValue(16)} color={colors.error} style={styles.actionIcon} />
                <Text style={[styles.signOutAllText, { color: colors.error }]}>
                  {t("security_logout_all")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    overflow: "hidden",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  separator: {
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(14),
  },
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
    marginRight: -4,
  },
  deviceIconBox: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "nowrap",
    maxWidth: "100%",
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  currentBadgeText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  logoutSmallBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutSmallText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  loadingContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  signOutText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  signOutAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  signOutAllText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  actionIcon: {
    marginRight: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SecurityScreen;
