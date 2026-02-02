import {useState} from "react";
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Lock,
  ShieldCheck,
  Smartphone,
  Laptop,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import Header from "~components/Header";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

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
          <Text style={[styles.title, {color: colors.textPrimary}]}>{device}</Text>
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
        <TouchableOpacity style={[styles.logoutSmallBtn, {borderColor: colors.logoutBorder}]} onPress={onLogout}>
          <Text style={[styles.logoutSmallText, {color: colors.error}]}>Log Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const SecurityScreen = ({onQuickAction, navigation}) => {
  const {colors, isDark} = useTheme();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

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
        <View style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
          <SessionRow
            icon={Smartphone}
            device="iPhone 14 Pro"
            location="San Francisco, US • Active now"
            isCurrent={true}
            colors={colors}
          />
          <SessionRow
            icon={Laptop}
            device="MacBook Air"
            location="San Francisco, US • 2 days ago"
            isLast={true}
            onLogout={() => console.log("Logging out macbook")}
            colors={colors}
          />
        </View>

        {/* SIGN OUT ALL BUTTON */}
        <TouchableOpacity style={[styles.signOutAllButton, {backgroundColor: colors.logoutBackground, borderColor: colors.logoutBorder}]}>
          <LogOut size={RFValue(16)} color={colors.error} style={{marginRight: 8}} />
          <Text style={[styles.signOutAllText, {color: colors.error}]}>Sign out of all devices</Text>
        </TouchableOpacity>

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
    if (bgColor === "#dcfce7") return "#16a34a"; // Green-600
    return "#6b7280";
  },

  // Text Styling
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
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
  },
  logoutSmallText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },

  // Bottom Action Button
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
