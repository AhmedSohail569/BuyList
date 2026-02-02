/**
 * Custom Toast configuration for react-native-toast-message
 */
import { View, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";

// Light mode colors for auth screens (forceLight)
const lightModeColors = {
  card: "#FFFFFF",
  textPrimary: "#1B1A1F",
  textSecondary: "#4B5563",
  iconSecondary: "#6B7280",
  border: "#E5E7EB",
  shadowColor: "#000000",
  success: "#22C55E",
  error: "#EF4444",
  primary: "#1E9DF1",
  warning: "#F97316",
};

const BaseToast = ({ text1, text2, type, props }) => {
  const { colors } = useTheme();

  // Check if forceLight is passed in props
  const forceLight = props?.forceLight || false;
  const activeColors = forceLight ? lightModeColors : colors;

  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          iconColor: activeColors.success,
          borderColor: activeColors.success,
        };
      case "error":
        return {
          icon: "close-circle",
          iconColor: activeColors.error,
          borderColor: activeColors.error,
        };
      case "info":
        return {
          icon: "information-circle",
          iconColor: activeColors.primary,
          borderColor: activeColors.primary,
        };
      case "warning":
        return {
          icon: "warning",
          iconColor: activeColors.warning,
          borderColor: activeColors.warning,
        };
      default:
        return {
          icon: "information-circle",
          iconColor: activeColors.iconSecondary,
          borderColor: activeColors.border,
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: activeColors.card,
          borderLeftColor: config.borderColor,
          shadowColor: activeColors.shadowColor,
        },
      ]}>
      <Icon
        name={config.icon}
        size={24}
        color={config.iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        {text1 && <Text style={[styles.title, { color: activeColors.textPrimary }]}>{text1}</Text>}
        {text2 && <Text style={[styles.message, { color: activeColors.textSecondary }]}>{text2}</Text>}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: ({ props, ...rest }) => <BaseToast {...rest} props={props} type="success" />,
  error: ({ props, ...rest }) => <BaseToast {...rest} props={props} type="error" />,
  info: ({ props, ...rest }) => <BaseToast {...rest} props={props} type="info" />,
  warning: ({ props, ...rest }) => <BaseToast {...rest} props={props} type="warning" />,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: RFValue(13),
    fontWeight: "400",
    marginBottom: 2,
  },
  message: {
    fontSize: RFValue(12),
  },
});

export default toastConfig;
