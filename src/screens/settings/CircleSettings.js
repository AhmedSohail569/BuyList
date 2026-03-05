import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  ShoppingBag,
  MapPin,
  Shield,
  Bell,
  LogOut,
  Trash2,
  ChevronRight,
  Pencil,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import SelectionModal from "~containers/modals/SelectionModal";
import { DEFAULT_ROLES } from "~constants";
import {
  editCircleName,
  updateCircleDefaultMemberRole,
  fetchOwnedCircle,
} from "~redux/actions/circleActions";
import { clearCircleError } from "~redux/reducers/circleReducer";
import { useTheme } from "~context/ThemeContext";
import useOnReconnect from "~hooks/useOnReconnect";

const SettingsRow = ({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast,
  titleStyle,
  colors,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.rowContainer, { backgroundColor: colors.card }, !isLast && [styles.separator, { borderBottomColor: colors.divider }]]}>
      {/* Icon */}
      {Icon && (
        <View
          style={[styles.iconBox, { backgroundColor: iconBgColor || colors.backgroundSecondary }]}>
          <Icon
            size={RFValue(18)}
            color={iconColor || colors.iconSecondary}
            strokeWidth={1.5}
          />
        </View>
      )}

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }, titleStyle]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>

      {/* Right Element */}
      <View style={styles.rightContainer}>
        {rightElement || <ChevronRight size={RFValue(16)} color={colors.iconMuted} />}
      </View>
    </TouchableOpacity>
  );
};

const CircleSettingsScreen = ({ onQuickAction, navigation }) => {
  const dispatch = useDispatch();
  const { ownedCircle, loading, error } = useSelector(state => state.circles);
  const { colors, isDark } = useTheme();

  console.log("ownedCircle", ownedCircle);

  // Fetch fresh own circle data on mount
  useEffect(() => {
    dispatch(fetchOwnedCircle());
  }, [dispatch]);

  // Re-fetch circle data when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchOwnedCircle());
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultRole, setDefaultRole] = useState("Editor");

  // Initialize circle name from Redux state
  const [circleName, setCircleName] = useState(
    ownedCircle?.name || "Family Home",
  );

  const [homeLocation, setHomeLocation] = useState(
    ownedCircle?.owner?.zone || "Family Home",
  );

  // Update circle name when ownedCircle changes
  useEffect(() => {
    if (ownedCircle?.name) {
      setCircleName(ownedCircle.name);
    }
  }, [ownedCircle?.name]);

  // Update home location when ownedCircle changes
  useEffect(() => {
    if (ownedCircle?.owner?.zone) {
      setHomeLocation(ownedCircle.owner.zone);
    }
  }, [ownedCircle?.owner?.zone]);

  // Initialize/update default role from Redux state (if backend provides it)
  useEffect(() => {
    const apiRole = ownedCircle?.defaultMemberRole;
    if (apiRole === "editor") setDefaultRole("Editor");
    else if (apiRole === "viewer") setDefaultRole("Viewer");
  }, [ownedCircle?.defaultMemberRole]);

  // Handle API errors with toast
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: typeof error === "string" ? error : "Failed to update circle name",
      });
      dispatch(clearCircleError());
    }
  }, [error, dispatch]);

  const openModal = type => {
    setModalType(type);
    setModalVisible(true);
  };

  // Validate circle name
  const validateCircleName = name => {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return "Circle name cannot be empty";
    }
    if (trimmedName.length < 2) {
      return "Circle name must be at least 2 characters";
    }
    if (trimmedName.length > 50) {
      return "Circle name must be less than 50 characters";
    }
    return null;
  };

  const handleSave = async newValue => {
    if (modalType === "defaultRole") {
      const circleId = ownedCircle?._id || ownedCircle?.id;
      if (!circleId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Circle not found",
        });
        return;
      }

      const label = typeof newValue === "string" ? newValue : defaultRole;
      const apiRole = String(label || "").toLowerCase();
      if (apiRole !== "editor" && apiRole !== "viewer") {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "Please select a valid default role",
        });
        return;
      }

      // No change → close modal
      if (apiRole === ownedCircle?.defaultMemberRole) {
        setDefaultRole(label);
        setModalVisible(false);
        return;
      }

      try {
        await dispatch(
          updateCircleDefaultMemberRole({
            circleId,
            defaultMemberRole: apiRole,
          }),
        ).unwrap();

        setDefaultRole(label);
        setModalVisible(false);

        Toast.show({
          type: "success",
          text1: "Default Role Updated",
          text2: `New connections will join as ${label}s`,
        });
      } catch (err) {
        // Error is handled by useEffect above (toast + clearCircleError)
      }
      return;
    }

    if (modalType === "circleName") {
      // Validate circle name
      const validationError = validateCircleName(newValue);
      if (validationError) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: validationError,
        });
        return;
      }

      // Check if name actually changed
      const trimmedName = newValue.trim();
      if (trimmedName === ownedCircle?.name) {
        // No change, just close modal
        setModalVisible(false);
        return;
      }

      // Get circle ID
      const circleId = ownedCircle?._id || ownedCircle?.id;
      if (!circleId) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Circle not found",
        });
        return;
      }

      // Dispatch edit action
      try {
        await dispatch(
          editCircleName({
            circleId,
            name: trimmedName,
          }),
        ).unwrap();

        // Show success toast
        Toast.show({
          type: "success",
          text1: "Circle Updated",
          text2: "Circle name updated successfully",
        });

        // Update local state
        setCircleName(trimmedName);
        setModalVisible(false);
      } catch (err) {
        // Error is handled by useEffect above
        // Don't close modal on error so user can retry
      }
      return;
    }

    // Handle other modal types (leave, delete)
    console.log(`Saved ${modalType}:`, newValue);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={"Circle Settings"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* GENERAL SECTION */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>GENERAL</Text>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon={ShoppingBag}
            iconBgColor={isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe"}
            iconColor={colors.primary}
            title="Circle Name"
            subtitle={circleName || "Family Home"}
            rightElement={<Pencil size={RFValue(16)} color={colors.iconMuted} />}
            onPress={() => openModal("circleName")}
            colors={colors}
          />
          <SettingsRow
            icon={MapPin}
            iconBgColor={isDark ? "rgba(249, 115, 22, 0.2)" : "#ffedd5"}
            iconColor="#f97316"
            title="Home Location"
            subtitle={homeLocation || "Set your home location"}
            isLast
            colors={colors}
            onPress={() => navigation.navigate("ChangeHomeLocation")}
          />
        </View>

        {/* PREFERENCES SECTION */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon={Shield}
            iconBgColor={isDark ? "rgba(168, 85, 247, 0.2)" : "#f3e8ff"}
            iconColor="#a855f7"
            title="Default Role"
            subtitle={`New connections join as ${defaultRole}s`}
            onPress={() => openModal("defaultRole")}
            colors={colors}
          />
          <SettingsRow
            icon={Bell}
            iconBgColor={isDark ? "rgba(234, 179, 8, 0.2)" : "#fef9c3"}
            iconColor="#eab308"
            title="Notifications"
            subtitle="All activity"
            isLast
            colors={colors}
            rightElement={
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={"#ffffff"}
                ios_backgroundColor={colors.border}
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
                style={styles.switch}
              />
            }
          />
        </View>

        {/* DANGER ZONE SECTION - Commented out for now */}
        {/* <Text style={[styles.sectionHeader, styles.dangerHeader]}>
          DANGER ZONE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon={LogOut}
            iconBgColor="transparent"
            iconColor={colors.iconSecondary}
            title="Leave Circle"
            titleStyle={{ fontFamily: FontFamily.medium }}
            rightElement={<View />}
            onPress={() => openModal("leave")}
            colors={colors}
          />
          <SettingsRow
            icon={Trash2}
            iconBgColor="transparent"
            iconColor={colors.error}
            title="Delete Circle"
            titleStyle={{ color: colors.error }}
            rightElement={<View />}
            onPress={() => openModal("delete")}
            isLast
            colors={colors}
          />
        </View>

        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Deleting a circle is permanent and will remove all shared lists and
          history for everyone.
        </Text> */}

        <View style={{ height: 40 }} />
      </ScrollView>
      <SelectionModal
        isVisible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          // Clear any errors when closing
          if (error) {
            dispatch(clearCircleError());
          }
        }}
        onSave={handleSave}
        type={
          modalType === "defaultRole"
            ? "selection"
            : modalType === "circleName"
              ? "input"
              : "confirmation"
        }
        title={
          modalType === "defaultRole"
            ? "Change Default Role"
            : modalType === "leave"
              ? "Leave Circle"
              : modalType === "delete"
                ? "Delete Circle"
                : "Edit Circle Name"
        }
        initialValue={modalType === "defaultRole" ? defaultRole : circleName}
        description={
          modalType === "leave"
            ? "Leaving this circle will remove you from all shared lists. Do you want to continue?"
            : modalType === "delete"
              ? "Deleting this circle will permanently remove all shared lists and connections."
              : ""
        }
        danger={modalType === "leave" || modalType === "delete" ? true : false}
        options={DEFAULT_ROLES}
        confirmLabel={
          (modalType === "circleName" || modalType === "defaultRole") && loading
            ? "Saving..."
            : "Save"
        }
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
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dangerHeader: {
    color: "#f87171", // Salmon/Red color for Danger Zone header
  },

  // Card Styles
  card: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Row Styles
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  separator: {
    borderBottomWidth: 1,
  },

  // Icon Styles
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  // Text Styles
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
  },

  // Right Element Styles
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
    marginRight: -4,
  },

  // Footer Note
  footerNote: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(14),
    marginTop: -8,
    marginLeft: 4,
  },
});

export default CircleSettingsScreen;
