import {View, StyleSheet, Image} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {useState} from "react";
import {CommonActions} from "@react-navigation/native";

const LoginScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <OnboardingLayout>
      <Image
        source={Images.buyListIconBlue}
        style={{
          width: RFValue(50),
          height: RFValue(50),
          alignSelf: "center",
          marginTop: RFPercentage(15),
          position: "absolute",
        }}
        resizeMode="contain"
      />
      <View
        style={[styles.content, {paddingBottom: insets.bottom + RFValue(24)}]}>
        <View>
          {/* Title */}
          <Text variant="sectionTitle" style={styles.title}>
            Log in
          </Text>

          {/* Subtitle */}
          <Text variant="bodySmall" color="muted" style={styles.subtitle}>
            Enter your credentials to continue
          </Text>

          <TextInput
            label="Email"
            placeholder="samrana@example.com"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail"
            type={2}
          />

          <TextInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon="lock"
            type={2}
          />

          <Text
            variant="bodySmall"
            color="error"
            align="right"
            style={{marginBottom: RFValue(10), fontSize: RFValue(10)}}
            onPress={() => navigation.navigate("ForgotPassword")}>
            Forgot Password?
          </Text>

          {/* Button */}
          <Button
            title="Log in"
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{name: "AppNavigator"}],
                }),
              )
            }
          />

          <View style={{flexDirection: "row", alignSelf: "center"}}>
            <Text variant="bodySmall" style={styles.textStyle}>
              Don't have an account?{" "}
            </Text>
            <Text
              variant="link"
              color="primary"
              onPress={() => navigation.navigate("Signup")}
              style={[
                styles.textStyle,
                {
                  textDecorationLine: "underline",
                },
              ]}>
              Sign Up
            </Text>
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
    paddingHorizontal: 20,
    marginTop: RFPercentage(20),
  },

  title: {
    marginBottom: 8,
    fontSize: RFValue(20),
  },

  subtitle: {
    marginBottom: RFValue(20),
  },

  textStyle: {
    marginVertical: RFValue(10),
    fontSize: RFValue(10),
  },
});

export default LoginScreen;
