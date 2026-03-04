import {useState} from "react";
import {View, StyleSheet, Switch, Platform} from "react-native";
import {
  Users,
  Tag,
  ShoppingCart,
  Calendar,
  Bell,
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

const NotificationRow = ({
  icon: Icon,
  color,
  title,
  description,
  isEnabled,
  onToggle,
  isLast,
  colors,
}) => {
  return (
    <View style={[styles.rowContainer, {backgroundColor: colors.card}, !isLast && [styles.separator, {borderBottomColor: colors.divider}]]}>
      {/* Icon */}
      <View style={[styles.iconBox, {backgroundColor: color}]}>
        <Icon size={RFValue(18)} color="#fff" strokeWidth={1.5} />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
        <Text style={[styles.description, {color: colors.textSecondary}]} numberOfLines={2}>
          {description}
        </Text>
      </View>

      {/* Switch */}
      <Switch
        trackColor={{false: colors.border, true: colors.primary}}
        thumbColor={"#ffffff"}
        ios_backgroundColor={colors.border}
        onValueChange={onToggle}
        value={isEnabled}
        style={styles.switch}
      />
    </View>
  );
};

const NotificationsScreen = ({onQuickAction, navigation}) => {
  const {colors, isDark} = useTheme();
  const [toggles, setToggles] = useState({
    sharedList: true,
    priceDrop: true,
    newItems: true,
    weekly: false,
    promotions: true,
  });

  // Re-fetch settings when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchNotificationSettings());
  });

  // Re-fetch settings when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchNotificationSettings());
  });

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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        variant="screen"
        title={"Notifications"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Main Settings Card */}
        <View style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
          <NotificationRow
            icon={Users}
            color="#a855f7"
            title="Shared List Updates"
            description="When members add or check items"
            isEnabled={toggles.sharedList}
            onToggle={() => handleToggle("sharedList")}
            colors={colors}
          />
          <NotificationRow
            icon={Tag}
            color="#22c55e"
            title="Price Drop Alerts"
            description="Notify when watched items go on sale"
            isEnabled={toggles.priceDrop}
            onToggle={() => handleToggle("priceDrop")}
            colors={colors}
          />
          <NotificationRow
            icon={ShoppingCart}
            color="#f97316"
            title="New Items Added"
            description="Alerts when someone adds to your lists"
            isEnabled={toggles.newItems}
            onToggle={() => handleToggle("newItems")}
            colors={colors}
          />
          <NotificationRow
            icon={Calendar}
            color="#3b82f6"
            title="Weekly Reminders"
            description="Remind me to shop on weekends"
            isEnabled={toggles.weekly}
            onToggle={() => handleToggle("weekly")}
            colors={colors}
          />
          <NotificationRow
            icon={Bell}
            color="#ec4899"
            title="Promotions & Tips"
            description="News, updates, and shopping tips"
            isEnabled={toggles.promotions}
            onToggle={() => handleToggle("promotions")}
            isLast
            colors={colors}
          />
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, {backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff"}]}>
          <Info size={RFValue(18)} color={colors.primary} style={styles.infoIcon} />
          <Text style={[styles.infoText, {color: colors.primary}]}>
            You can also manage system-level notifications for BuyList in your
            device settings.
          </Text>
        </View>

        <View style={{height: 40}} />
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
  card: {
    borderRadius: 16,
    paddingVertical: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
  },

  // Info Box Styles
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
