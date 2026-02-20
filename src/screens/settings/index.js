import { View, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";

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
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useState } from "react";
import SelectionModal from "~containers/modals/SelectionModal";
import { DISTANCE_OPTIONS, LANGUAGE_OPTIONS } from "~constants";
import { logoutAndPurge } from "~redux/store";
import { useAlert } from "~context/AlertContext";
import { useTheme } from "~context/ThemeContext";

/**
 * Reusable component for a single setting row
 */
const SettingsOption = ({
  icon: Icon,
  color,
  label,
  value,
  onPress,
  isLast,
  rightComponent,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.optionContainer, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon size={RFValue(18)} color="#fff" strokeWidth={1.5} />
      </View>

      <View
        style={[
          styles.contentWrapper,
          !isLast && styles.separator,
          { borderBottomColor: colors.divider },
        ]}>
        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
        <View style={styles.rightContent}>
          {value && (
            <Text style={[styles.valueText, { color: colors.textMuted }]}>
              {value}
            </Text>
          )}
          {rightComponent ? (
            rightComponent
          ) : (
            <ChevronRight size={RFValue(16)} color={colors.textDisabled} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Reusable component for the section header and container
 */
const SettingsSection = ({ title, children }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        {title}
      </Text>
      <View style={[styles.cardContainer, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );
};

const SettingsTab = ({ onQuickAction, navigation }) => {
  const { showAlert, showError } = useAlert();
  const { colors, isDark, toggleTheme } = useTheme();
  const logoutCurrentLoading = useSelector(state => state.session.logoutCurrentLoading);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'language' | 'distance'

  // Value State
  const [language, setLanguage] = useState("English");
  const [distance, setDistance] = useState("Miles");

  // Helper to open specific modal
  const openModal = type => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = newValue => {
    if (modalType === "language") setLanguage(newValue);
    if (modalType === "distance") setDistance(newValue);
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
              await logoutAndPurge();
            } catch (err) {
              showError("Logout Failed", err?.message || "Could not logout. Please try again.");
            }
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title="Settings"
        showProfile
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ACCOUNT */}
        <SettingsSection title="ACCOUNT">
          <SettingsOption
            icon={User}
            color="#3B82F6"
            label="Profile Settings"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingsOption
            icon={ShieldCheck}
            color="#22C55E"
            label="Security"
            onPress={() => navigation.navigate("AccountSecurity")}
            isLast
          />
        </SettingsSection>

        {/* PREFERENCES */}
        <SettingsSection title="PREFERENCES">
          <SettingsOption
            icon={Bell}
            color="#F97316"
            label="Notifications"
            onPress={() => navigation.navigate("Notifications")}
          />
          <SettingsOption
            icon={Moon}
            color="#A855F7"
            label="Dark Mode"
            rightComponent={
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#ffffff"}
                ios_backgroundColor={colors.border}
                onValueChange={toggleTheme}
                value={isDark}
                style={styles.switch}
              />
            }
          />
          <SettingsOption
            icon={Globe}
            color="#6366F1"
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
            color="#EC4899"
            label="Manage Circle"
            onPress={() => navigation.navigate("CircleSettings")}
          />
          <SettingsOption
            icon={List}
            color="#14B8A6"
            label="Shared Lists"
            onPress={() => {
              const tabNav = navigation.getParent?.();
              if (tabNav?.navigate) {
                tabNav.navigate("Lists", {
                  screen: "ListsTab",
                  params: { filter: "shared", _timestamp: Date.now() },
                });
              } else {
                navigation.navigate("Lists", {
                  screen: "ListsTab",
                  params: { filter: "shared", _timestamp: Date.now() },
                });
              }
            }}
            isLast
          />
        </SettingsSection>

        {/* LOCATION */}
        <SettingsSection title="LOCATION">
          <SettingsOption
            icon={MapPin}
            color="#6B7280"
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
            color="#EAB308"
            label="Help & Support"
          />
          <SettingsOption
            icon={FileText}
            color="#60A5FA"
            label="Legal"
            onPress={() => navigation.navigate("Legal")}
            isLast
          />
        </SettingsSection>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.logoutBackground,
              borderColor: colors.logoutBorder,
            },
            logoutCurrentLoading && { opacity: 0.7 },
          ]}
          onPress={handleLogout}
          disabled={logoutCurrentLoading}>
          {logoutCurrentLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.logoutText}
              style={styles.logoutIcon}
            />
          ) : (
            <LogOut
              size={RFValue(18)}
              color={colors.logoutText}
              style={styles.logoutIcon}
            />
          )}
          <Text style={[styles.logoutText, { color: colors.logoutText }]}>
            {logoutCurrentLoading ? "Logging out..." : "Log Out"}
          </Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
      <SelectionModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        title={
          modalType === "language" ? "Select Language" : "Select Distance"
        }
        initialValue={modalType === "language" ? language : distance}
        options={modalType === "language" ? LANGUAGE_OPTIONS : DISTANCE_OPTIONS}
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
    paddingTop: 8,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },

  // Option Row Styles
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
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
  },
  optionLabel: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    fontWeight: "600",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: RFValue(11),
    marginRight: 6,
    fontFamily: FontFamily.regular,
  },

  // Logout Button Styles
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    fontWeight: "700",
  },
  logoutIcon: {
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});

export default SettingsTab;
