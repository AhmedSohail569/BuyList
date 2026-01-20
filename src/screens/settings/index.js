import {View, TouchableOpacity, StyleSheet} from "react-native";
import {
  User,
  ShieldCheck,
  Bell,
  Moon,
  Globe,
  Users,
  List,
  MapPin,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import Header from "~components/Header";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useState} from "react";
import SelectionModal from "~containers/modals/SelectionModal";
import {DISTANCE_OPTIONS, LANGUAGE_OPTIONS, THEME_OPTIONS} from "~constants";
import {logout} from "~redux/reducers/authReducer";
import {clearAccessToken} from "~utils";
import {useDispatch} from "react-redux";
import {useAlert} from "~context/AlertContext";

/**
 * Reusable component for a single setting row
 */
const SettingsOption = ({icon: Icon, color, label, value, onPress, isLast}) => {
  return (
    <TouchableOpacity
      style={styles.optionContainer}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconBox, {backgroundColor: color}]}>
        <Icon size={RFValue(18)} color="#fff" strokeWidth={1.5} />
      </View>

      <View style={[styles.contentWrapper, !isLast && styles.separator]}>
        <Text style={styles.optionLabel}>{label}</Text>
        <View style={styles.rightContent}>
          {value && <Text style={styles.valueText}>{value}</Text>}
          <ChevronRight size={RFValue(16)} color="#d1d5db" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Reusable component for the section header and container
 */
const SettingsSection = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionHeader}>{title}</Text>
    <View style={styles.cardContainer}>{children}</View>
  </View>
);

const SettingsTab = ({onQuickAction, navigation}) => {
  const {showAlert, showError} = useAlert();
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'theme' | 'language'

  // Value State
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("English");
  const [distance, setDistance] = useState("Miles");

  // Helper to open specific modal
  const openModal = type => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = newValue => {
    if (modalType === "theme") setTheme(newValue);
    if (modalType === "language") setLanguage(newValue);
    if (modalType === "distance") setDistance(newValue);
    console.log(`Saved ${modalType}:`, newValue);
  };

  const handleLogout = () => {
    showAlert({
      title: "Logout",
      message: "Are you sure you want to logout?",
      type: "confirm",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear token from AsyncStorage
              await clearAccessToken();

              // Clear Redux state (this will also set hasLoggedOut flag)
              // RootNavigator will automatically switch to OnboardingNavigator
              // OnboardingNavigator will start at Login due to hasLoggedOut flag
              dispatch(logout());
            } catch (err) {
              console.error("Logout error:", err);
              showError("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Settings"}
        showProfile
        avatar={{uri: "https://i.pravatar.cc/150"}}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ACCOUNT */}
        <SettingsSection title="ACCOUNT">
          {/* <SettingsOption
            icon={DollarSign}
            color="#FF3F3F" // Red
            label="Edit Subscription"
            onPress={() => navigation.navigate("EditSubscription")}
          /> */}
          <SettingsOption
            icon={User}
            color="#3B82F6" // Blue
            label="Profile Settings"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingsOption
            icon={ShieldCheck}
            color="#22C55E" // Green
            label="Security"
            onPress={() => navigation.navigate("AccountSecurity")}
            isLast
          />
        </SettingsSection>

        {/* PREFERENCES */}
        <SettingsSection title="PREFERENCES">
          <SettingsOption
            icon={Bell}
            color="#F97316" // Orange
            label="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
          <SettingsOption
            icon={Moon}
            color="#A855F7" // Purple
            label="Theme"
            value={theme}
            onPress={() => openModal("theme")}
          />
          <SettingsOption
            icon={Globe}
            color="#6366F1" // Indigo
            label="Language"
            value={language}
            onPress={() => openModal("language")}
            isLast
          />
        </SettingsSection>

        {/* BUYLIST FEATURES */}
        <SettingsSection title="BUYLIST FEATURES">
          <SettingsOption
            icon={Users}
            color="#EC4899" // Pink
            label="Manage Circle"
            onPress={() => navigation.navigate("CircleSettings")}
          />
          <SettingsOption
            icon={List}
            color="#14B8A6" // Cyan
            label="Shared Lists"
            onPress={() => navigation.navigate("SharedLists")}
            isLast
          />
        </SettingsSection>

        {/* LOCATION */}
        <SettingsSection title="LOCATION">
          <SettingsOption
            icon={MapPin}
            color="#6B7280" // Slate
            label="Distance"
            value={distance}
            onPress={() => openModal("distance")}
            isLast
          />
        </SettingsSection>

        {/* SUPPORT */}
        <SettingsSection title="SUPPORT">
          <SettingsOption
            icon={HelpCircle}
            color="#EAB308" // Yellow
            label="Help & Support"
          />
          <SettingsOption
            icon={FileText}
            color="#60A5FA" // Blue
            label="Legal"
            onPress={() => navigation.navigate("Legal")}
            isLast
          />
        </SettingsSection>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut
            size={RFValue(18)}
            color="#EF4444"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{height: 40}} />
      </ScrollView>
      <SelectionModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        title={
          modalType === "theme"
            ? "Select Theme"
            : modalType === "language"
            ? "Select Language"
            : "Select Distance"
        }
        initialValue={
          modalType === "theme"
            ? theme
            : modalType === "language"
            ? language
            : distance
        }
        options={
          modalType === "theme"
            ? THEME_OPTIONS
            : modalType === "language"
            ? LANGUAGE_OPTIONS
            : DISTANCE_OPTIONS
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6", // Matches screenshot background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af", // Gray-400
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden", // Ensures children don't bleed out of radius
  },

  // Option Row Styles
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    backgroundColor: "#fff",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingRight: 16,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6", // Very light divider
  },
  optionLabel: {
    fontSize: RFValue(12), // approx 14-15px
    fontFamily: FontFamily.medium, // Semi-bold look
    color: "#1f2937", // Gray-800
    fontWeight: "600",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: RFValue(11),
    color: "#9ca3af", // Gray-400
    marginRight: 6,
    fontFamily: FontFamily.regular,
  },

  // Logout Button Styles
  logoutButton: {
    backgroundColor: "#FEF2F2", // Red-100
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    color: "#EF4444", // Red-500
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    fontWeight: "700",
  },
  logoutIcon: {
    marginRight: 8,
  },
});

export default SettingsTab;
