import { useEffect, useState } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { Button, Text, TextInput } from "~components/Common";
import { Images } from "~assets";
import { signupUser } from "~redux/actions/authActions";
import { clearSignupState, clearError } from "~redux/reducers/authReducer";
import { validateEmail, validatePassword, validateUsername, removeEmojis } from "~utils/validation";

const SignupScreen = ({ navigation, route }) => {
  const { phone, zone, area } = route?.params || {};
  const { loading, signupSuccess, error } = useSelector(state => state.auth);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Field-level errors
  const [errors, setErrors] = useState({
    username: null,
    email: null,
    password: null,
  });

  // Handle successful signup
  useEffect(() => {
    if (signupSuccess) {
      Toast.show({
        type: "success",
        text1: "Account Created",
        text2: "Please verify your email to continue",
        props: { forceLight: true },
      });
      navigation.navigate("OTPVerification", {
        email,
      });
      dispatch(clearSignupState());
    }
  }, [signupSuccess, navigation, email, dispatch]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      const errorObj = typeof error === "object" ? error : null;
      
      const hasFields = errorObj?.fields && errorObj.fields.length > 0;
      let mappedAnyInline = false;
      let unmappedErrorMessages = [];

      if (hasFields) {
        const newErrors = { ...errors };
        errorObj.fields.forEach(f => {
          if (newErrors[f.field] !== undefined) {
            newErrors[f.field] = f.message;
            mappedAnyInline = true;
          } else {
            unmappedErrorMessages.push(f.message);
          }
        });
        setErrors(newErrors);
      }
      
      // Show toast IF we didn't map any inline error, OR if there's an error for a hidden field
      if (!mappedAnyInline || unmappedErrorMessages.length > 0) {
        const toastMessage = unmappedErrorMessages.length > 0 
          ? unmappedErrorMessages.join('\n') 
          : errorObj?.message || (typeof error === "string" ? error : "Something went wrong");

        Toast.show({
          type: "error",
          text1: "Signup Failed",
          text2: toastMessage,
          props: { forceLight: true },
        });
      }
      
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Clear field error when user starts typing
  const handleUsernameChange = value => {
    const cleanValue = removeEmojis(value);
    setUsername(cleanValue);
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: null }));
    }
  };

  const handleEmailChange = value => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  const handlePasswordChange = value => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
    }
  };

  const validateForm = () => {
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, false); // false = not login, enforce min length

    setErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
    });

    return !usernameError && !emailError && !passwordError;
  };

  const handleSignUp = () => {
    if (!validateForm()) {
      return;
    }

    dispatch(
      signupUser({
        email: email.trim(),
        password: password,
        username: username.trim(),
        phone: phone?.fullPhone,
        zone: zone,
        area: area,
      }),
    );
  };

  return (
    <OnboardingLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive">
      <Image
        source={Images.baggIconBlue}
        style={{
          width: RFValue(60),
          height: RFValue(60),
          alignSelf: "center",
          marginTop: RFPercentage(15),
          position: "absolute",
        }}
        resizeMode="contain"
      />
      <View
        style={[styles.content, { paddingBottom: insets.bottom + RFValue(24) }]}>
        {/* Title */}
        <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
          Sign Up
        </Text>

        {/* Subtitle */}
        <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
          Enter your credentials to continue
        </Text>

        <TextInput
          label="Username"
          placeholder="Bagg User"
          value={username}
          onChangeText={handleUsernameChange}
          type={2}
          autoCapitalize="words"
          error={errors.username}
          forceLight
        />

        <TextInput
          label="Email"
          placeholder="bagg@example.com"
          value={email}
          onChangeText={handleEmailChange}
          type={2}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          forceLight
        />

        <TextInput
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={handlePasswordChange}
          type={2}
          error={errors.password}
          forceLight
        />

        <Text
          variant="bodySmall"
          style={{ marginBottom: RFValue(15), fontSize: RFValue(10), color: "#9CA3AF" }}>
          By continuing you agree to our{" "}
          <Text
            style={{ marginBottom: RFValue(10), fontSize: RFValue(10), color: "#1E9DF1" }}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            style={{ marginBottom: RFValue(10), fontSize: RFValue(10), color: "#1E9DF1" }}>
            Privacy Policy.
          </Text>
        </Text>

        {/* Button */}
        <Button
          title="Sign Up"
          onPress={() => handleSignUp()}
          loading={loading}
          forceLight
        />

        <View style={{ flexDirection: "row", alignSelf: "center" }}>
          <Text variant="bodySmall" style={[styles.textStyle, { color: "#9CA3AF" }]}>
            Already have an account?{" "}
          </Text>
          <Text
            variant="link"
            onPress={() => navigation.navigate("Login")}
            style={[
              styles.textStyle,
              {
                textDecorationLine: "underline",
                color: "#1E9DF1",
              },
            ]}>
            Login
          </Text>
        </View>
      </View>
      </ScrollView>
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
