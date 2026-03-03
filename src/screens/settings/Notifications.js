import { useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Users,
  Tag,
  ShoppingCart,
  Calendar,
  Bell,
  BellOff,
  Info,
  Megaphone,
  Lightbulb,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import {
  fetchNotificationSettings,
  updateNotificationSetting,
} from "~redux/actions/notificationActions";

const NotificationRow = ({
  icon: Icon,
  color,
  title,
  description,
  isEnabled,
  onToggle,
  isLast,
  colors,
  disabled,
  updating,
}) => (
  <View
    style={[
      styles.rowContainer,
      { backgroundColor: colors.card },
      !isLast && [styles.separator, { borderBottomColor: colors.divider }],
      disabled && styles.rowDisabled,
    ]}
  >
    <View style={[styles.iconBox, { backgroundColor: color }, disabled && { opacity: 0.4 }]}>
      <Icon size={RFValue(18)} color="#fff" strokeWidth={1.5} />
    </View>

    <View style={styles.textContainer}>
      <Text
        style={[
          styles.title,
          { color: disabled ? colors.textDisabled : colors.textPrimary },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: disabled ? colors.textDisabled : colors.textSecondary },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>
    </View>

    {updating ? (
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.loader}
      />
    ) : (
      <Switch
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.border}
        onValueChange={onToggle}
        value={isEnabled}
        style={styles.switch}
        disabled={disabled || updating}
      />
    )}
  </View>
);

const MasterToggle = ({ isEnabled, onToggle, colors, updating }) => (
  <View
    style={[
      styles.masterRow,
      {
        backgroundColor: isEnabled
          ? colors.primary + "12"
          : colors.card,
        borderColor: isEnabled ? colors.primary + "30" : colors.divider,
      },
    ]}
  >
    <View style={[styles.masterIcon, { backgroundColor: isEnabled ? "#22c55e" : colors.border }]}>
      {isEnabled ? (
        <Bell size={RFValue(20)} color="#fff" strokeWidth={1.5} />
      ) : (
        <BellOff size={RFValue(20)} color="#fff" strokeWidth={1.5} />
      )}
    </View>

    <View style={styles.masterText}>
      <Text style={[styles.masterTitle, { color: colors.textPrimary }]}>
        Push Notifications
      </Text>
      <Text style={[styles.masterDescription, { color: colors.textSecondary }]}>
        {isEnabled
          ? "You will receive notifications"
          : "All notifications are paused"}
      </Text>
    </View>

    {updating ? (
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.loader}
      />
    ) : (
      <Switch
        trackColor={{ false: colors.border, true: "#22c55e" }}
        thumbColor="#ffffff"
        ios_backgroundColor={colors.border}
        onValueChange={onToggle}
        value={isEnabled}
        style={styles.masterSwitch}
        disabled={updating}
      />
    )}
  </View>
);

const NOTIFICATION_ITEMS = [
  {
    key: "sharedListUpdates",
    icon: Users,
    color: "#a855f7",
    title: "Shared List Updates",
    description: "When members add or check items",
    isApi: true,
  },
  {
    key: "itemAddedAlerts",
    icon: ShoppingCart,
    color: "#f97316",
    title: "New Items Added",
    description: "Alerts when someone adds to your lists",
    isApi: true,
  },
  {
    key: "priceDrop",
    icon: Tag,
    color: "#22c55e",
    title: "Price Drop Alerts",
    description: "Notify when watched items go on sale",
    isApi: false,
  },
  {
    key: "weeklyReminders",
    icon: Calendar,
    color: "#3b82f6",
    title: "Weekly Reminders",
    description: "Remind me to shop on weekends",
    isApi: true,
  },
  {
    key: "promotions",
    icon: Megaphone,
    color: "#ec4899",
    title: "Promotions",
    description: "Deals, discounts, and special offers",
    isApi: true,
  },
  {
    key: "tips",
    icon: Lightbulb,
    color: "#eab308",
    title: "Tips & Updates",
    description: "Shopping tips, news, and app updates",
    isApi: true,
  },
];

const NotificationsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const { settings, settingsLoading, updatingKeys } = useSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotificationSettings());
  }, [dispatch]);

  const handleToggle = useCallback(
    (key, isApi) => {
      if (!isApi) return;
      dispatch(
        updateNotificationSetting({ key, value: !settings[key] }),
      );
    },
    [dispatch, settings],
  );

  const handleMasterToggle = useCallback(() => {
    dispatch(
      updateNotificationSetting({
        key: "pushEnabled",
        value: !settings.pushEnabled,
      }),
    );
  }, [dispatch, settings.pushEnabled]);

  const pushDisabled = !settings.pushEnabled;

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
            Loading settings...
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
        showsVerticalScrollIndicator={false}
      >
        <MasterToggle
          isEnabled={settings.pushEnabled}
          onToggle={handleMasterToggle}
          colors={colors}
          updating={!!updatingKeys.pushEnabled}
        />

        {pushDisabled && (
          <View
            style={[
              styles.pausedBanner,
              { backgroundColor: isDark ? "rgba(234, 179, 8, 0.12)" : "#fefce8" },
            ]}
          >
            <BellOff size={RFValue(16)} color="#eab308" style={styles.pausedIcon} />
            <Text style={[styles.pausedText, { color: isDark ? "#fbbf24" : "#a16207" }]}>
              Push notifications are turned off. Individual preferences below
              will take effect when you re-enable them.
            </Text>
          </View>
        )}

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          NOTIFICATION TYPES
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, shadowColor: colors.shadowColor },
          ]}
        >
          {NOTIFICATION_ITEMS.map((item, index) => (
            <NotificationRow
              key={item.key}
              icon={item.icon}
              color={item.color}
              title={item.title}
              description={item.description}
              isEnabled={item.isApi ? !!settings[item.key] : true}
              onToggle={() => handleToggle(item.key, item.isApi)}
              isLast={index === NOTIFICATION_ITEMS.length - 1}
              colors={colors}
              disabled={pushDisabled || !item.isApi}
              updating={!!updatingKeys[item.key]}
            />
          ))}
        </View>

        <View
          style={[
            styles.infoBox,
            { backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff" },
          ]}
        >
          <Info size={RFValue(18)} color={colors.primary} style={styles.infoIcon} />
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
  },
  loaderText: {
    marginTop: 12,
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },

  // Master toggle
  masterRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  masterIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  masterText: {
    flex: 1,
    paddingRight: 10,
  },
  masterTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  masterDescription: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(14),
  },
  masterSwitch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
  },

  // Paused banner
  pausedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  pausedIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  pausedText: {
    flex: 1,
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(15),
  },

  // Section
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card
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
  rowDisabled: {
    opacity: 0.55,
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
  title: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  description: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(14),
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
  },
  loader: {
    width: 51,
    height: 31,
  },

  // Info box
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
