import {useEffect, useRef} from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import {RFValue} from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import AppText from "./Text";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

/**
 * Alert Types:
 * - 'default' - Standard alert with info icon
 * - 'success' - Green checkmark icon
 * - 'error' - Red error icon
 * - 'warning' - Yellow warning icon
 * - 'confirm' - Question mark icon for confirmations
 */

const ALERT_CONFIGS = {
  default: {
    icon: "information-circle",
    iconColor: "#38BAEF",
    iconBgColor: "#E5F6FE",
  },
  success: {
    icon: "checkmark-circle",
    iconColor: "#4CAF50",
    iconBgColor: "#E8F5E9",
  },
  error: {
    icon: "close-circle",
    iconColor: "#F44336",
    iconBgColor: "#FFEBEE",
  },
  warning: {
    icon: "warning",
    iconColor: "#FF9800",
    iconBgColor: "#FFF3E0",
  },
  confirm: {
    icon: "alert-outline",
    iconColor: "#9C27B0",
    iconBgColor: "#F3E5F5",
  },
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = "default",
  buttons = [{text: "OK", onPress: () => {}}],
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = ALERT_CONFIGS[type] || ALERT_CONFIGS.default;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleButtonPress = button => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const getButtonStyle = buttonStyle => {
    switch (buttonStyle) {
      case "destructive":
        return {
          backgroundColor: "#FFF0F0",
          borderColor: "#FFE0E0",
        };
      case "cancel":
        return {
          backgroundColor: "#F5F5F5",
          borderColor: "#E0E0E0",
        };
      case "success":
        return {
          backgroundColor: "#4CAF50",
          borderColor: "#4CAF50",
        };
      default:
        return {
          backgroundColor: "#38BAEF",
          borderColor: "#38BAEF",
        };
    }
  };

  const getButtonTextStyle = buttonStyle => {
    switch (buttonStyle) {
      case "cancel":
        return {color: "#333"};
      case "destructive":
        return {color: "#FF4444"};
      default:
        return {color: "#FFF"};
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, {opacity: opacityAnim}]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.alertContainer,
                {
                  transform: [{scale: scaleAnim}],
                },
              ]}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: config.iconBgColor},
                ]}>
                <Icon name={config.icon} size={40} color={config.iconColor} />
              </View>

              {/* Title */}
              {title && <AppText style={styles.title}>{title}</AppText>}

              {/* Message */}
              {message && <AppText style={styles.message}>{message}</AppText>}

              {/* Buttons */}
              <View
                style={[
                  styles.buttonContainer,
                  buttons.length === 1 && styles.singleButtonContainer,
                ]}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      buttons.length === 1 && styles.singleButton,
                      getButtonStyle(button.style),
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}>
                    <AppText
                      style={[
                        styles.buttonText,
                        getButtonTextStyle(button.style),
                      ]}>
                      {button.text}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    width: SCREEN_WIDTH - 60,
    maxWidth: 340,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: RFValue(13),
    color: "#666",
    textAlign: "center",
    lineHeight: RFValue(20),
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  singleButtonContainer: {
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
    paddingHorizontal: 30,
  },
  buttonText: {
    fontSize: RFValue(14),
    fontWeight: "500",
  },
});

export default CustomAlert;
