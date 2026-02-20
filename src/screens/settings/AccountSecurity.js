import {useState, useEffect} from "react";
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
import {useDispatch, useSelector} from "react-redux";
import Header from "~components/Header";
import {ScrollView, Text, Alert as CustomAlert} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";
import {
  getSessions,
  logoutSession,
  logoutAllOtherSessions,
  logoutAllSessions,
} from "~redux/actions/sessionActions";
import {logout} from "~redux/reducers/authReducer";
import {logoutAndPurge} from "~redux/store";

const SecurityRow = ({
  icon: Icon,
  color,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast,
  colors,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.rowContainer, {backgroundColor: colors.card}, !isLast && [styles.separator, {borderBottomColor: colors.divider}]]}>
      {/* Icon */}
      <View style={[styles.iconBox, {backgroundColor: color}]}>
        <Icon
          size={RFValue(18)}
          color={styles.iconColor(color)}
          strokeWidth={1.5}
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>{subtitle}</Text>
      </View>

      {/* Right Element (Switch or Chevron) */}
      <View style={styles.rightContainer}>
        {rightElement || <ChevronRight size={RFValue(16)} color={colors.iconMuted} />}
      </View>
    </TouchableOpacity>
  );
};

const SessionRow = ({
  icon: Icon,
  device,
  location,
  isCurrent,
  onLogout,
  isLast,
  colors,
  loading,
}) => {
  return (
    <View style={[styles.rowContainer, {backgroundColor: colors.card}, !isLast && [styles.separator, {borderBottomColor: colors.divider}]]}>
      {/* Device Icon */}
      <View style={styles.deviceIconBox}>
        <Icon
          size={RFValue(20)}
          color={isCurrent ? colors.primary : colors.iconSecondary}
          strokeWidth={1.5}
        />
      </View>

      {/* Session Info */}
      <View style={styles.textContainer}>
        <View style={styles.deviceHeader}>
          <Text 
            style={[styles.title, {color: colors.textPrimary}]} 
            numberOfLines={1}
            ellipsizeMode="tail">
            {device}
          </Text>
          {isCurrent && (
            <View style={[styles.currentBadge, {backgroundColor: colors.badgeBackground}]}>
              <Text style={[styles.currentBadgeText, {color: colors.badgeText}]}>Current</Text>
            </View>
          )}
        </View>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>{location}</Text>
      </View>

      {/* Logout Action */}
      {!isCurrent && (
        <TouchableOpacity 
          style={[styles.logoutSmallBtn, {borderColor: colors.logoutBorder}]} 
          onPress={onLogout}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Text style={[styles.logoutSmallText, {color: colors.error}]}>Log Out</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Helper function to determine device icon
const getDeviceIcon = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
    case 'phone':
      return Smartphone;
    case 'tablet':
      return Tablet;
    case 'desktop':
      return Monitor;
    case 'laptop':
      return Laptop;
    default:
      return Smartphone;
  }
};

// Format last active time
const formatLastActive = (lastActive) => {
  if (!lastActive) return 'Unknown';
  
  const now = new Date();
  const activeDate = new Date(lastActive);
  const diffMs = now - activeDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Active now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};

const SecurityScreen = ({onQuickAction, navigation}) => {
  const {colors, isDark} = useTheme();
  const dispatch = useDispatch();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'confirm',
    buttons: [],
  });

  // Redux state
  const {
    sessions,
    loading,
    logoutSessionLoading,
    logoutOtherLoading,
    logoutAllLoading,
  } = useSelector(state => state.session);

  // Fetch sessions on mount
  useEffect(() => {
    dispatch(getSessions());
  }, [dispatch]);

  // Close alert
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Handle logout single session
  const handleLogoutSession = (sessionId, deviceName) => {
    setAlertConfig({
      visible: true,
      title: 'End Session',
      message: `Are you sure you want to logout from ${deviceName}?`,
      type: 'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeAlert },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutSession({sessionId}));
            closeAlert();
          },
        },
      ],
    });
  };

  // Handle logout all other sessions
  const handleLogoutOthers = () => {
    if (sessions.length <= 1) return;

    setAlertConfig({
      visible: true,
      title: 'Logout Other Devices',
      message: 'This will logout all other devices except this one.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeAlert },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutAllOtherSessions());
            closeAlert();
          },
        },
      ],
    });
  };

  // Handle logout all sessions
  const handleLogoutAll = () => {
    setAlertConfig({
      visible: true,
      title: 'Logout from All Devices',
      message: "You will be logged out from all your devices including this one. You'll need to login again.",
      type: 'error',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeAlert },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Logout from all sessions on backend
              await dispatch(logoutAllSessions()).unwrap();
              
              // Logout from current device (clear local auth state + purge persisted store)
              logoutAndPurge();
              
              closeAlert();
            } catch (error) {
              console.error('Failed to logout from all devices:', error);
              closeAlert();
            }
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        variant="screen"
        title={"Account Security"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* LOGIN & RECOVERY SECTION */}
        <Text style={[styles.sectionHeader, {color: colors.textMuted}]}>LOGIN & RECOVERY</Text>
        <View style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
          <SecurityRow
            icon={Lock}
            color={isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe"}
            title="Change Password"
            subtitle="Last changed 3 months ago"
            onPress={() => {}}
            colors={colors}
          />
          <SecurityRow
            icon={ShieldCheck}
            color={isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7"}
            title="Two-Factor Auth"
            subtitle="Secure your account"
            isLast
            colors={colors}
            rightElement={
              <Switch
                trackColor={{false: colors.border, true: colors.primary}}
                thumbColor={"#ffffff"}
                ios_backgroundColor={colors.border}
                onValueChange={setIs2FAEnabled}
                value={is2FAEnabled}
                style={styles.switch}
              />
            }
          />
        </View>

        {/* ACTIVE SESSIONS SECTION */}
        <Text style={[styles.sectionHeader, {color: colors.textMuted}]}>ACTIVE SESSIONS</Text>
        
        {loading ? (
          <View style={[styles.loadingContainer, {backgroundColor: colors.card}]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
              Loading sessions...
            </Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={[styles.emptyContainer, {backgroundColor: colors.card}]}>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              No active sessions found
            </Text>
          </View>
        ) : (
          <View style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
            {sessions.map((session, index) => (
              <SessionRow
                key={session.id}
                icon={getDeviceIcon(session.deviceType)}
                device={session.deviceName || session.browser || 'Unknown Device'}
                location={`${session.location || 'Unknown'} • ${session?.isCurrent ? 'Active Now' : formatLastActive(session.lastUsedAt)}`}
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
            style={[
              styles.signOutButton, 
              { borderColor: colors.logoutBorder}
            ]}
            onPress={handleLogoutOthers}
            disabled={logoutOtherLoading}>
            {logoutOtherLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <LogOut size={RFValue(16)} color={colors.error} style={{marginRight: 8}} />
                <Text style={[styles.signOutText, {color: colors.error}]}>
                  Logout All Other Devices
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {sessions.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.signOutAllButton, 
              {borderColor: colors.logoutBorder}
            ]}
            onPress={handleLogoutAll}
            disabled={logoutAllLoading}>
            {logoutAllLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <LogOut size={RFValue(16)} color={colors.error} style={{marginRight: 8}} />
                <Text style={[styles.signOutAllText, {color: colors.error}]}>
                  Logout from All Devices
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{height: 40}} />
      </ScrollView>

      {/* Custom Alert */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Section Headers
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card & Rows
  card: {
    borderRadius: 16,
    marginBottom: 24,
    shadowOffset: {width: 0, height: 2},
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

  // Icon Styling
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  // Helper to darken the icon color based on bg color (approximate logic for this UI)
  iconColor: bgColor => {
    if (bgColor === "#e0f2fe") return "#0284c7"; // Sky-600
    if (bgColor === "rgba(14, 165, 233, 0.2)") return "#0ea5e9"; // Sky-500
    if (bgColor === "#dcfce7") return "#16a34a"; // Green-600
    if (bgColor === "rgba(34, 197, 94, 0.2)") return "#22c55e"; // Green-500
    return "#6b7280";
  },

  // Text Styling
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

  // Right Elements
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
    marginRight: -4, // Adjust for visual alignment
  },

  // Session Specific Styles
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: RFValue(8),
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

  // Loading & Empty States
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

  // Bottom Action Buttons
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
});

export default SecurityScreen;
