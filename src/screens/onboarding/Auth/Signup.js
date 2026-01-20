import {useEffect, useState} from "react";
import {View, StyleSheet, Image} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import {signupUser} from "~redux/actions/authActions";
import {clearSignupState} from "~redux/reducers/authReducer";

const SignupScreen = ({navigation, route}) => {
  const {phone, zone, area} = route?.params || {};
  const {loading, signupSuccess} = useSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (signupSuccess) {
      navigation.navigate("OTPVerification", {
        email,
      });
      dispatch(clearSignupState());
    }
  }, [signupSuccess, navigation]);

  const handleSignUp = () => {
    dispatch(
      signupUser({
        email: email,
        password: password,
        username: username,
        phone: phone?.fullPhone,
        zone: zone,
        area: area,
      }),
    );
  };

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
        {/* Title */}
        <Text variant="sectionTitle" style={styles.title}>
          Sign Up
        </Text>

        {/* Subtitle */}
        <Text variant="bodySmall" color="muted" style={styles.subtitle}>
          Enter your credentials to continue
        </Text>

        <TextInput
          label="Username"
          placeholder="Samrana Shoukat"
          value={username}
          onChangeText={setUsername}
          type={2}
        />

        <TextInput
          label="Email"
          placeholder="samrana@example.com"
          value={email}
          onChangeText={setEmail}
          type={2}
        />

        <TextInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          type={2}
        />

        <Text
          variant="bodySmall"
          style={{marginBottom: RFValue(15), fontSize: RFValue(10)}}>
          By continuing you agree to our{" "}
          <Text
            color="primary"
            style={{marginBottom: RFValue(10), fontSize: RFValue(10)}}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            color="primary"
            style={{marginBottom: RFValue(10), fontSize: RFValue(10)}}>
            Privacy Policy.
          </Text>
        </Text>

        {/* Button */}
        <Button
          title="Sign Up"
          onPress={() => handleSignUp()}
          loading={loading}
        />

        <View style={{flexDirection: "row", alignSelf: "center"}}>
          <Text variant="bodySmall" style={styles.textStyle}>
            Already have an account?{" "}
          </Text>
          <Text
            variant="link"
            color="primary"
            onPress={() => navigation.navigate("Login")}
            style={[
              styles.textStyle,
              {
                textDecorationLine: "underline",
              },
            ]}>
            Login
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
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

export default SignupScreen;
