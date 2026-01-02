import {View, StyleSheet, Image, TouchableOpacity} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import Icon from "react-native-vector-icons/FontAwesome";
import {useState} from "react";

const GetStartedScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState("");

  const showFab = phone.trim().length > 0;

  return (
    <OnboardingLayout>
      {/* Content */}
      <Image
        source={Images.getStartedBg}
        style={{height: RFPercentage(50), width: "100%", position: "absolute"}}
        resizeMode="stretch"
      />
      <View
        style={[styles.content, {paddingBottom: insets.bottom + RFValue(24)}]}>
        {/* Title */}
        <Text variant="sectionTitle" style={styles.title}>
          Let’s get your shopping{"\n"}done with BuyList!
        </Text>

        <TextInput
          type={3}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Subtitle */}
        <Text
          variant="bodySmall"
          color="muted"
          align="center"
          style={styles.subtitle}>
          Or connect with social media
        </Text>

        <View style={[styles.socialButton, {backgroundColor: "#5383EC"}]}>
          <Icon name="google" size={30} color={"#FFFFFF"} />
          <Text variant="bodySmall" color="white" style={styles.textStyle}>
            Continue with Google
          </Text>
        </View>

        <View style={[styles.socialButton, {backgroundColor: "#000000"}]}>
          <Icon name="apple" size={30} color={"#FFFFFF"} />
          <Text variant="bodySmall" color="white" style={styles.textStyle}>
            Continue with Apple
          </Text>
        </View>

        <View style={{flexDirection: "row"}}>
          <Text variant="bodySmall" color="muted" style={styles.textStyle}>
            Already have an Account?{" "}
          </Text>
          <Text
            variant="link"
            color="primary"
            onPress={() => navigation.navigate("Login")}
            style={styles.textStyle}>
            Login
          </Text>
        </View>
      </View>

      {/* ✅ Floating Action Button */}
      {showFab && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.fab,
            {
              bottom: insets.bottom + RFValue(20),
            },
          ]}
          onPress={() => navigation.navigate("OTPVerification", {phone})}>
          <Icon name="chevron-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },

  title: {
    marginBottom: 8,
    fontSize: RFValue(20),
  },

  subtitle: {
    marginVertical: RFValue(20),
  },

  socialButton: {
    marginBottom: RFValue(15),
    paddingVertical: RFValue(5),
    borderRadius: RFValue(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFValue(20),
  },

  textStyle: {
    marginVertical: RFValue(10),
  },

  fab: {
    position: "absolute",
    right: RFValue(20),
    height: RFValue(45),
    width: RFValue(45),
    borderRadius: RFValue(26),
    backgroundColor: "#1E9DF1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
  },
});

export default GetStartedScreen;
