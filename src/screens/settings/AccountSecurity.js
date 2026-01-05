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

const SecurityRow = ({
  icon: Icon,
  color,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.rowContainer, !isLast && styles.separator]}>
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
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Right Element (Switch or Chevron) */}
      <View style={styles.rightContainer}>
        {rightElement || <ChevronRight size={RFValue(16)} color="#d1d5db" />}
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
}) => {
  return (
    <View style={[styles.rowContainer, !isLast && styles.separator]}>
      {/* Device Icon */}
      <View style={styles.deviceIconBox}>
        <Icon
          size={RFValue(20)}
          color={isCurrent ? "#0ea5e9" : "#6b7280"}
          strokeWidth={1.5}
        />
      </View>

      {/* Session Info */}
      <View style={styles.textContainer}>
        <View style={styles.deviceHeader}>
          <Text style={styles.title}>{device}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{location}</Text>
      </View>

      {/* Logout Action */}
      {!isCurrent && (
        <TouchableOpacity style={styles.logoutSmallBtn} onPress={onLogout}>
          <Text style={styles.logoutSmallText}>Log Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const SecurityScreen = ({onQuickAction, navigation}) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Account Security"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* LOGIN & RECOVERY SECTION */}
        <Text style={styles.sectionHeader}>LOGIN & RECOVERY</Text>
        <View style={styles.card}>
          <SecurityRow
            icon={Lock}
            color="#e0f2fe" // Light Blue
            title="Change Password"
            subtitle="Last changed 3 months ago"
            onPress={() => {}}
          />
          <SecurityRow
            icon={ShieldCheck}
            color="#dcfce7" // Light Green
            title="Two-Factor Auth"
            subtitle="Secure your account"
            isLast
            rightElement={
              <Switch
                trackColor={{false: "#E5E7EB", true: "#0ea5e9"}}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#E5E7EB"
                onValueChange={setIs2FAEnabled}
                value={is2FAEnabled}
                style={styles.switch}
              />
            }
          />
        </View>

        {/* ACTIVE SESSIONS SECTION */}
        <Text style={styles.sectionHeader}>ACTIVE SESSIONS</Text>
        <View style={styles.card}>
          <SessionRow
            icon={Smartphone}
            device="iPhone 14 Pro"
            location="San Francisco, US • Active now"
            isCurrent={true}
          />
          <SessionRow
            icon={Laptop}
            device="MacBook Air"
            location="San Francisco, US • 2 days ago"
            isLast={true}
            onLogout={() => console.log("Logging out macbook")}
          />
        </View>

        {/* SIGN OUT ALL BUTTON */}
        <TouchableOpacity style={styles.signOutAllButton}>
          <LogOut size={RFValue(16)} color="#ef4444" style={{marginRight: 8}} />
          <Text style={styles.signOutAllText}>Sign out of all devices</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // Light Gray Background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Section Headers
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af", // Gray-400
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Card & Rows
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 24,
    // Soft Shadow
    shadowColor: "#000",
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
    backgroundColor: "#fff",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
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
    backgroundColor: "#e0f2fe", // Sky-100
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentBadgeText: {
    color: "#0284c7", // Sky-600
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  logoutSmallBtn: {
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutSmallText: {
    color: "#ef4444",
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },

  // Bottom Action Button
  signOutAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff", // Or very faint red '#fff5f5'
    borderWidth: 1,
    borderColor: "#fee2e2",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  signOutAllText: {
    color: "#ef4444", // Red-500
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
});

export default SecurityScreen;
