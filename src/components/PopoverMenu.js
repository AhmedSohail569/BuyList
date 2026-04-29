import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Popover, { PopoverPlacement } from "react-native-popover-view";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";

const PopoverMenu = ({
  visible,
  onDismiss,
  anchor,
  children,
  popoverStyle,
  placement = PopoverPlacement.AUTO,
}) => {
  const { colors } = useTheme();
  const anchorRef = React.useRef(null);
  
  // Safe proxy ref to prevent react-native-popover-view from crashing 
  // when 'current' becomes null during navigation / unmounting.
  const safeRef = React.useRef({
    measureInWindow: (callback) => {
      if (anchorRef.current && typeof anchorRef.current.measureInWindow === 'function') {
        anchorRef.current.measureInWindow(callback);
      } else {
        // Fallback to prevent crash if unmounted
        callback(0, 0, 0, 0);
      }
    },
    measure: (callback) => {
      if (anchorRef.current && typeof anchorRef.current.measure === 'function') {
        anchorRef.current.measure(callback);
      } else {
        callback(0, 0, 0, 0, 0, 0);
      }
    }
  });

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {anchor}
      </View>
      <Popover
        isVisible={visible}
        onRequestClose={onDismiss}
        from={safeRef}
        placement={placement}
        popoverStyle={[
          styles.popover,
          { backgroundColor: colors.modalBackground, shadowColor: colors.shadowColor },
          popoverStyle,
        ]}
        backgroundStyle={styles.background}
        animationConfig={{ duration: 200 }}
      >
        <View style={styles.menuContent}>{children}</View>
      </Popover>
    </>
  );
};

const PopoverMenuItem = ({ onPress, title, titleStyle }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuItemText, { color: colors.textPrimary }, titleStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

PopoverMenu.Item = PopoverMenuItem;

const styles = StyleSheet.create({
  popover: {
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  background: {
    // Keep background transparent to avoid darkening the screen like a modal
    backgroundColor: "transparent",
  },
  menuContent: {
    flexDirection: "column",
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
});

export default PopoverMenu;
