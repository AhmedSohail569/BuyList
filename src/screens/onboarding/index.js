import React from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Image,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {RFValue} from "react-native-responsive-fontsize";
import {Button, Text} from "~components/Common";
import {Images} from "~assets";

const {height} = Dimensions.get("window");

const OnboardingScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={Images.onboarding}
        style={styles.image}
        imageStyle={styles.imageStyle}>
        {/* Content */}
        <View
          style={[
            styles.content,
            {paddingBottom: insets.bottom + RFValue(24)},
          ]}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Image
              source={Images.buyListIcon}
              style={{width: 80, height: 80}}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text variant="screenTitle" style={[styles.title, {color: "#FFFFFF"}]}>
            Welcome to your{"\n"}shopping hub
          </Text>

          {/* Subtitle */}
          <Text variant="bodySmall" style={[styles.subtitle, {color: "#9CA3AF"}]}>
            Shop smarter together with BuyList
          </Text>

          {/* Button */}
          <Button
            title="Get Started"
            onPress={() => navigation.navigate("GetStarted")}
            forceLight
          />
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAEAEA",
  },

  image: {
    flex: 1,
    justifyContent: "flex-end",
  },

  imageStyle: {
    // borderRadius: 28,
    height: height,
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 24,
  },

  iconWrapper: {
    marginBottom: 16,
  },

  title: {
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    textAlign: "center",
    marginBottom: RFValue(20),
  },
});

export default OnboardingScreen;
