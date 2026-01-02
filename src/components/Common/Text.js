import React from "react";
import {Text, TouchableOpacity} from "react-native";
import PropTypes from "prop-types";
import {Typography} from "../../theme/typography";

const COLORS = {
  default: "#1B1A1F",
  primary: "#1E9DF1",
  secondary: "#666666",
  muted: "#9E9E9E",
  error: "#FF4D4D",
  white: "#FFFFFF",
};

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
  const textStyle = [
    Typography[variant],
    {color: COLORS[color], textAlign: align},
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
  ]),
};

export default AppText;
