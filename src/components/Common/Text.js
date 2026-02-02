import React from "react";
import {Text, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import {Typography} from "../../theme/typography";
import {useTheme} from "~context/ThemeContext";

const AppText = ({
  children,
  onPress,
  variant = "body",
  color = "default",
  align = "left",
  style,
  numberOfLines,
  ...props
}) => {
  const {colors, isDark} = useTheme();

  // Map color names to theme colors
  const getColor = colorName => {
    switch (colorName) {
      case "default":
        return colors.textPrimary;
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.textSecondary;
      case "muted":
        return colors.textMuted;
      case "error":
        return colors.error;
      case "white":
        return isDark ? colors.textPrimary : "#FFFFFF";
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      default:
        // If it's a hex color, use it directly
        if (colorName && colorName.startsWith("#")) {
          return colorName;
        }
        return colors.textPrimary;
    }
  };

  const textStyle = [
    Typography[variant],
    {color: getColor(color), textAlign: align},
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Text style={textStyle} numberOfLines={numberOfLines} {...props}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text style={textStyle} numberOfLines={numberOfLines} {...props}>
      {children}
    </Text>
  );
};

AppText.propTypes = {
  variant: PropTypes.oneOf([
    "screenTitle",
    "sectionTitle",
    "body",
    "bodySmall",
    "caption",
    "button",
    "link",
    "small",
    "medium",
  ]),
  color: PropTypes.string,
  align: PropTypes.oneOf(["left", "center", "right"]),
};

export default AppText;
