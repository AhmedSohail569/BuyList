import {useEffect, useState} from "react";
import {View, StyleSheet, Image} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {useDispatch, useSelector} from "react-redux";
import Toast from "react-native-toast-message";

import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {loginUser} from "~redux/actions/authActions";
import {clearError} from "~redux/reducers/authReducer";
import {validateEmail, validatePassword} from "~utils/validation";

const LoginScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {loading, error} = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Field-level errors
  const [errors, setErrors] = useState({
    email: null,
    password: null,
  });

  // Handle API errors with toast
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: typeof error === "string" ? error : "Something went wrong",
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Clear field error when user starts typing
  const handleEmailChange = value => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({...prev, email: null}));
    }
  };

  const handlePasswordChange = value => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({...prev, password: null}));
    }
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, true); // true = isLogin

    setErrors({
      email: emailError,
      password: passwordError,
    });

    return !emailError && !passwordError;
  };

  const handleLogin = () => {
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all fields correctly",
      });
      return;
    }

    dispatch(
      loginUser({
        email: email.trim(),
        password: password,
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
            onChangeText={handleEmailChange}
            leftIcon="mail"
            type={2}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <TextInput
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={handlePasswordChange}
            leftIcon="lock"
            type={2}
            error={errors.password}
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
            onPress={() => handleLogin()}
            loading={loading}
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
