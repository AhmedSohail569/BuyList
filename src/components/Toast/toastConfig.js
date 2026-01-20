/**
 * Custom Toast configuration for react-native-toast-message
 */
import {View, StyleSheet} from "react-native";
import {RFValue} from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import {Text} from "~components/Common";

const BaseToast = ({text1, text2, type}) => {
  const getConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          iconColor: "#4CAF50",
          borderColor: "#4CAF50",
          bgColor: "#FFFFFF",
        };
      case "error":
        return {
          icon: "close-circle",
          iconColor: "#F44336",
          borderColor: "#F44336",
          bgColor: "#FFFFFF",
        };
      case "info":
        return {
          icon: "information-circle",
          iconColor: "#2196F3",
          borderColor: "#2196F3",
          bgColor: "#FFFFFF",
        };
      case "warning":
        return {
          icon: "warning",
          iconColor: "#FF9800",
          borderColor: "#FF9800",
          bgColor: "#FFFFFF",
        };
      default:
        return {
          icon: "information-circle",
          iconColor: "#666",
          borderColor: "#666",
          bgColor: "#FFFFFF",
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: config.bgColor, borderLeftColor: config.borderColor},
      ]}>
      <Icon
        name={config.icon}
        size={24}
        color={config.iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.title}>{text1}</Text>}
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  );
};

export const toastConfig = {
  success: props => <BaseToast {...props} type="success" />,
  error: props => <BaseToast {...props} type="error" />,
  info: props => <BaseToast {...props} type="info" />,
  warning: props => <BaseToast {...props} type="warning" />,
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
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
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
    color: "#333",
    marginBottom: 2,
  },
  message: {
    fontSize: RFValue(12),
    color: "#666",
  },
});

export default toastConfig;
