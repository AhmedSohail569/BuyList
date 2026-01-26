import {useState, useEffect} from "react";
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
import {useDispatch, useSelector} from "react-redux";
import Toast from "react-native-toast-message";
import Header from "~components/Header";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import SelectionModal from "~containers/modals/SelectionModal";
import {DEFAULT_ROLES} from "~constants";
import {editCircleName} from "~redux/actions/circleActions";
import {clearCircleError} from "~redux/reducers/circleReducer";

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
}) => {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.rowContainer, !isLast && styles.separator]}>
      {/* Icon */}
      {Icon && (
        <View
          style={[styles.iconBox, {backgroundColor: iconBgColor || "#f3f4f6"}]}>
          <Icon
            size={RFValue(18)}
            color={iconColor || "#6b7280"}
            strokeWidth={1.5}
          />
        </View>
      )}

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right Element */}
      <View style={styles.rightContainer}>
        {rightElement || <ChevronRight size={RFValue(16)} color="#d1d5db" />}
      </View>
    </TouchableOpacity>
  );
};

const CircleSettingsScreen = ({onQuickAction, navigation}) => {
  const dispatch = useDispatch();
  const {ownedCircle, loading, error} = useSelector(state => state.circles);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultRole, setDefaultRole] = useState("Editor");
  
  // Initialize circle name from Redux state
  const [circleName, setCircleName] = useState(
    ownedCircle?.name || "Family Home",
  );

  // Update circle name when ownedCircle changes
  useEffect(() => {
    if (ownedCircle?.name) {
      setCircleName(ownedCircle.name);
    }
  }, [ownedCircle?.name]);

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
      setDefaultRole(newValue);
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
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Circle Settings"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* GENERAL SECTION */}
        <Text style={styles.sectionHeader}>GENERAL</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={ShoppingBag}
            iconBgColor="#e0f2fe" // Light Blue
            iconColor="#0ea5e9" // Blue
            title="Circle Name"
            subtitle={circleName || "Family Home"}
            rightElement={<Pencil size={RFValue(16)} color="#9ca3af" />}
            onPress={() => openModal("circleName")}
          />
          <SettingsRow
            icon={MapPin}
            iconBgColor="#ffedd5" // Light Orange
            iconColor="#f97316" // Orange
            title="Home Location"
            subtitle="123 Maple Street, Springfield"
            isLast
          />
        </View>

        {/* PREFERENCES SECTION */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={Shield}
            iconBgColor="#f3e8ff" // Light Purple
            iconColor="#a855f7" // Purple
            title="Default Role"
            subtitle="New connections join as Editors"
            onPress={() => openModal("defaultRole")}
          />
          <SettingsRow
            icon={Bell}
            iconBgColor="#fef9c3" // Light Yellow
            iconColor="#eab308" // Yellow
            title="Notifications"
            subtitle="All activity"
            isLast
            rightElement={
              <Switch
                trackColor={{false: "#E5E7EB", true: "#0ea5e9"}}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#E5E7EB"
                onValueChange={setNotificationsEnabled}
                value={notificationsEnabled}
                style={styles.switch}
              />
            }
          />
        </View>

        {/* DANGER ZONE SECTION */}
        <Text style={[styles.sectionHeader, styles.dangerHeader]}>
          DANGER ZONE
        </Text>
        <View style={styles.card}>
          <SettingsRow
            icon={LogOut}
            iconBgColor="transparent"
            iconColor="#4b5563"
            title="Leave Circle"
            titleStyle={{fontFamily: FontFamily.medium}}
            rightElement={<View />}
            onPress={() => openModal("leave")}
          />
          <SettingsRow
            icon={Trash2}
            iconBgColor="transparent"
            iconColor="#ef4444"
            title="Delete Circle"
            titleStyle={{color: "#ef4444"}} // Red text
            rightElement={<View />} // No chevron for delete usually, or empty view
            onPress={() => openModal("delete")}
            isLast
          />
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          Deleting a circle is permanent and will remove all shared lists and
          history for everyone.
        </Text>

        <View style={{height: 40}} />
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
          modalType === "circleName" && loading ? "Saving..." : "Save"
        }
      />
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
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
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
    backgroundColor: "#fff",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
    color: "#111827",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
  },

  // Right Element Styles
  rightContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
    marginRight: -4,
  },

  // Footer Note
  footerNote: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    lineHeight: RFValue(14),
    marginTop: -8, // Pull closer to the card above
    marginLeft: 4,
  },
});

export default CircleSettingsScreen;
