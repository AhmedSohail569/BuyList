/**
 * Avatar
 *
 * A reusable circular avatar component with an initials fallback.
 * Used across Circle, Home, ManageConnections, NotificationsDropdown, etc.
 *
 * Props:
 *  image  {string|null}  - URI of the profile picture. If falsy, shows initials.
 *  name   {string}       - User's display name (used for initials fallback).
 *  size   {number}       - Diameter in dp. Default 40.
 *  style  {object}       - Optional extra style for the outer container.
 *  colors {object}       - Theme colors from useTheme(). Must include `primary` and `badgeBackground`.
 */
import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { getInitials, hasProfilePicture } from "~utils/display";
import { Text } from "~components/Common";

const Avatar = ({ image, name, size = 40, style, colors }) => {
  const containerStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  if (hasProfilePicture(image)) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: image }}
          style={{ width: "100%", height: "100%",  borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: colors?.badgeBackground || "#e0f2fe",
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Text
        style={{
          fontSize: RFValue(size * 0.33),
          color: colors?.primary || "#0ea5e9",
          textAlign: "center",
        }}
      >
        {getInitials(name || "User")}
      </Text>
    </View>
  );
};

export default React.memo(Avatar);
