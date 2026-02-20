import React from "react";
import {View, StyleSheet, ImageBackground, StatusBar} from "react-native";
import {Images} from "~assets";

const OnboardingLayout = ({
  children,
  source = Images.onboardingBgLayout, // background image
  overlayOpacity = 0.35,
  statusBarStyle = "dark-content",
}) => {
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={statusBarStyle}
      />

      <ImageBackground
        source={source}
        style={styles.image}
        imageStyle={styles.imageRadius}
        resizeMode="stretch">
        {children}
      </ImageBackground>
    </View>
  );
};

export default OnboardingLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  image: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },
});
