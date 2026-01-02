import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import {RFValue} from "react-native-responsive-fontsize";
import AppText from "./Text";

const Button = ({
  onPress,
  title,
  subText,
  variant = "primary",
  iconName,
  loading,
  disabled,
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : "#000"} />
      ) : (
        <>
          {variant === "social" && (
            <Icon name={iconName} size={18} color="#1B1A1F" />
          )}

          <View style={styles.textWrapper}>
            <AppText
              variant="button"
              color={variant === "primary" ? "white" : "default"}>
              {title}
            </AppText>

            {subText && (
              <AppText variant="caption" color="muted">
                {subText}
              </AppText>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: RFValue(40),
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  primary: {
    backgroundColor: "#1E9DF1",
    width: "100%",
    height: RFValue(45),
  },

  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1E9DF1",
  },

  outline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  social: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "flex-start",
  },

  disabled: {
    opacity: 0.6,
  },

  textWrapper: {
    alignItems: "center",
  },
});

export default Button;
