// AppLayout.js
import React from "react";
import {View, StyleSheet, StatusBar} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTheme} from "~context/ThemeContext";

export default ({children, style, safeArea = true, statusBarColor, statusBarStyle}) => {
  const {colors, isDark} = useTheme();

  const bgColor = statusBarColor || colors.background;
  const barStyle = statusBarStyle || (isDark ? "light-content" : "dark-content");

  return (
    <View style={[styles.containerStyle, {backgroundColor: colors.background}, style]}>
      <StatusBar backgroundColor={bgColor} barStyle={barStyle} animated />
      {safeArea ? (
        <SafeAreaView
          edges={["left", "right"]}
          style={{flex: 1, backgroundColor: bgColor}}>
          {children}
        </SafeAreaView>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {flex: 1},
});
