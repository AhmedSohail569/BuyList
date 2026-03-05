/**
 * Notifications Settings Screen
 *
 * Push Notifications (master toggle — pushEnabled)
 *   ├─ Shared List Updates  (sharedListUpdates)
 *   ├─ Item Added Alerts    (itemAddedAlerts)
 *   └─ Weekly Reminders     (weeklyReminders)
 *
 * When pushEnabled is OFF, sub-toggles are shown greyed/off (UI only).
 * Each toggle patch-es only the changed key to /notifications/notification-settings.
 */
import { useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Bell,
  Users,
  ShoppingCart,
  Calendar,
  Tag,
  Megaphone,
  Info,
} from "lucide-react-native";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import {
  fetchNotificationSettings,
  updateNotificationSetting,
} from "~redux/actions/notificationActions";
import useOnReconnect from "~hooks/useOnReconnect";
import { useDispatch, useSelector } from "react-redux";

// ── Reusable Toggle Row ────────────────────────────────────────────────────────
const NotificationRow = ({
  icon: Icon,
  color,
  title,
  description,
  isEnabled,
  onToggle,
  isLast,
  disabled,
  colors,
}) => (
  <View
    style={[
      styles.rowContainer,
      { backgroundColor: colors.card, opacity: disabled ? 0.45 : 1 },
      !isLast && [styles.separator, { borderBottomColor: colors.divider }],
    ]}>
    {/* Icon */}
    <View style={[styles.iconBox, { backgroundColor: color }]}>
      <Icon size={RFValue(18)} color="#fff" strokeWidth={1.5} />
    </View>

    {/* Text */}
    <View style={styles.textContainer}>
      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text
        style={[styles.rowDescription, { color: colors.textSecondary }]}
        numberOfLines={2}>
        {description}
      </Text>
    </View>

    {/* Switch */}
    <Switch
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.border}
      onValueChange={onToggle}
      value={isEnabled}
      disabled={disabled}
      style={styles.switch}
    />
  </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────
const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { colors, isDark } = useTheme();
  const { settings, settingsLoading } = useSelector(
    (state) => state.notifications,
  );

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNotificationSettings());
  }, [dispatch]);

  // Re-fetch when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchNotificationSettings());
  });

  // Dispatch a single-key PATCH
  const handleToggle = useCallback(
    (key) => {
      dispatch(updateNotificationSetting({ key, value: !settings[key] }));
    },
    [dispatch, settings],
  );

  const pushOn = settings.pushEnabled;

  // ── Loading skeleton ───────────────────────────────────────
  if (settingsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          variant="screen"
          title="Notifications"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
            Loading settings…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title="Notifications"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Master toggle: Push Notifications ─────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          PUSH NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadowColor },
          ]}>
          <NotificationRow
            icon={Bell}
            color="#6366f1"
            title="Push Notifications"
            description="Allow BuyList to send you push notifications"
            isEnabled={pushOn}
            onToggle={() => handleToggle("pushEnabled")}
            isLast
            colors={colors}
          />
        </View>

        {/* ── Sub-settings ───────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: RFValue(20) }]}>
          NOTIFICATION TYPES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadowColor },
          ]}>
          <NotificationRow
            icon={Users}
            color="#a855f7"
            title="Shared List Updates"
            description="When members add or check items in your lists"
            isEnabled={pushOn && settings.sharedListUpdates}
            onToggle={() => handleToggle("sharedListUpdates")}
            disabled={!pushOn}
            colors={colors}
          />
          <NotificationRow
            icon={ShoppingCart}
            color="#f97316"
            title="Item Added Alerts"
            description="Alerts when someone adds items to your lists"
            isEnabled={pushOn && settings.itemAddedAlerts}
            onToggle={() => handleToggle("itemAddedAlerts")}
            disabled={!pushOn}
            colors={colors}
          />
          <NotificationRow
            icon={Calendar}
            color="#3b82f6"
            title="Weekly Reminders"
            description="Remind me to shop on weekends"
            isEnabled={pushOn && settings.weeklyReminders}
            onToggle={() => handleToggle("weeklyReminders")}
            disabled={!pushOn}
            colors={colors}
          />
          <NotificationRow
            icon={Tag}
            color="#22c55e"
            title="Price Drop Alerts"
            description="Coming soon — notify when watched items go on sale"
            isEnabled={false}
            onToggle={() => {}}
            disabled={true}
            colors={colors}
          />
          <NotificationRow
            icon={Megaphone}
            color="#ec4899"
            title="Promotions &amp; Tips"
            description="News, updates, and shopping tips from BuyList"
            isEnabled={pushOn && settings.promotions}
            onToggle={() => handleToggle("promotions")}
            disabled={!pushOn}
            isLast
            colors={colors}
          />
        </View>

        {/* ── Info box ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark
                ? "rgba(59, 130, 246, 0.15)"
                : "#eff6ff",
            },
          ]}>
          <Info
            size={RFValue(16)}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            You can also manage system-level notifications for BuyList in your
            device settings.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: RFValue(12),
  },
  loaderText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
  },
  sectionLabel: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.8,
    marginBottom: RFValue(8),
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
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
    paddingRight: 10,
  },
  rowTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(14),
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
  },
  infoBox: {
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(16),
  },
});

export default NotificationsScreen;
