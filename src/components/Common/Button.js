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
import {useTheme} from "~context/ThemeContext";

// Light mode colors for forceLight prop
const lightModeColors = {
  primary: "#1E9DF1",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#1B1A1F",
};

const Button = ({
  onPress,
  title,
  subText,
  variant = "primary",
  iconName,
  loading,
  disabled,
  style,
  forceLight = false,
}) => {
  const {colors, isDark} = useTheme();
  const isDisabled = disabled || loading;

  // Use light mode colors if forceLight is true
  const activeColors = forceLight ? lightModeColors : colors;
  const effectiveIsDark = forceLight ? false : isDark;

  // Get dynamic styles based on theme
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: activeColors.primary,
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: effectiveIsDark ? activeColors.surface : "#FFFFFF",
          borderWidth: 1,
          borderColor: activeColors.primary,
        };
      case "outline":
        return {
          backgroundColor: effectiveIsDark ? activeColors.surface : "#FFFFFF",
          borderWidth: 1,
          borderColor: activeColors.border,
        };
      case "social":
        return {
          backgroundColor: effectiveIsDark ? activeColors.surface : "#FFFFFF",
          borderWidth: 1,
          borderColor: activeColors.border,
          justifyContent: "flex-start",
        };
      default:
        return {};
    }
  };

  // Get text color based on variant
  const getTextColor = () => {
    if (variant === "primary") {
      return "#FFFFFF";
    }
    return forceLight ? "#1B1A1F" : undefined;
  };

  // Get icon color based on variant
  const getIconColor = () => {
    if (variant === "primary") {
      return "#FFFFFF";
    }
    return activeColors.textPrimary;
  };

  // Get loader color
  const getLoaderColor = () => {
    if (variant === "primary") {
      return "#FFFFFF";
    }
    return activeColors.textPrimary;
  };

  return (
    <TouchableOpacity
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.base,
        getVariantStyles(),
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={getLoaderColor()} />
      ) : (
        <>
          {variant === "social" && iconName && (
            <Icon name={iconName} size={18} color={getIconColor()} />
          )}

          <View style={styles.textWrapper}>
            <AppText variant="button" style={getTextColor() ? {color: getTextColor()} : undefined}>
              {title}
            </AppText>

            {subText && (
              <AppText variant="caption" style={forceLight ? {color: "#9CA3AF"} : undefined}>
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
    width: "100%",
    height: RFValue(45),
  },

  disabled: {
    opacity: 0.6,
  },

  textWrapper: {
    alignItems: "center",
  },
});

export default Button;
