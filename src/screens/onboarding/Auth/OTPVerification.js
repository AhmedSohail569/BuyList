import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { Text, TextInput } from "~components/Common";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import Icon from "react-native-vector-icons/FontAwesome";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import { verifyEmail, resendOTP, loginUser } from "~redux/actions/authActions";
import {
  clearVerifyEmailState,
  clearError,
  clearResendOTPState,
  clearPendingLoginCredentials,
} from "~redux/reducers/authReducer";
import { getProfile } from "~redux/actions/profileActions";
import { validateOTP } from "~utils/validation";

const OTPVerficationScreen = ({ navigation, route }) => {
  const { email } = route?.params || {};

  const {
    emailVerified,
    loading,
    error,
    resendOTPLoading,
    resendOTPMessage,
    resendOTPError,
    pendingLoginEmail,
    pendingLoginPassword,
  } = useSelector(state => state.auth);

  const dispatch = useDispatch();

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearResendOTPState());
      setResendCooldown(0);
    };
  }, [dispatch]);

  // Handle successful email verification
  useEffect(() => {
    if (emailVerified) {
      // Check if we have pending login credentials (from login flow)
      if (pendingLoginEmail && pendingLoginPassword) {
        // Automatically login after email verification
        dispatch(loginUser({
          email: pendingLoginEmail,
          password: pendingLoginPassword,
        }))
          .then((result) => {
            if (loginUser.fulfilled.match(result)) {
              // Fetch user profile
              dispatch(getProfile());
              // Clear pending credentials
              dispatch(clearPendingLoginCredentials());
              Toast.show({
                type: "success",
                text1: "Welcome Back!",
                text2: "You have been logged in successfully",
                props: { forceLight: true },
              });
            } else {
              // Login failed, navigate to login screen
              Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: "Please try logging in again",
                props: { forceLight: true },
              });
              navigation.navigate("Login", {
                email: pendingLoginEmail,
              });
              dispatch(clearPendingLoginCredentials());
            }
          });
      } else {
        // Normal verification flow (from signup)
        Toast.show({
          type: "success",
          text1: "Email Verified",
          text2: "Your email has been verified successfully",
          props: { forceLight: true },
        });
        navigation.navigate("Login", {
          email,
          otp: code || "0000",
        });
      }

      dispatch(clearVerifyEmailState());
    }
  }, [emailVerified, navigation, email, code, dispatch, pendingLoginEmail, pendingLoginPassword]);

  // Handle API errors with toast
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: typeof error === "string" ? error : "Invalid verification code",
        props: { forceLight: true },
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle resend OTP success
  useEffect(() => {
    if (resendOTPMessage) {
      Toast.show({
        type: "success",
        text1: "Code Resent",
        text2: resendOTPMessage,
        props: { forceLight: true },
      });
      // Set cooldown timer (60 seconds)
      setResendCooldown(60);
      dispatch(clearResendOTPState());
    }
  }, [resendOTPMessage, dispatch]);

  // Handle resend OTP error
  useEffect(() => {
    if (resendOTPError) {
      Toast.show({
        type: "error",
        text1: "Resend Failed",
        text2: typeof resendOTPError === "string" ? resendOTPError : "Failed to resend code",
        props: { forceLight: true },
      });
      dispatch(clearResendOTPState());
    }
  }, [resendOTPError, dispatch]);

  // Cooldown timer countdown
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendCooldown]);

  // Clear error when user starts typing
  const handleCodeChange = value => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");
    setCode(numericValue);
    if (codeError) {
      setCodeError(null);
    }
  };

  const handleVerify = () => {
    const otpError = validateOTP(code);
    if (otpError) {
      setCodeError(otpError);
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: otpError,
        props: { forceLight: true },
      });
      return;
    }

    dispatch(
      verifyEmail({
        email: email,
        otp: code,
      }),
    );
  };

  const handleResendCode = () => {
    // Prevent resend if cooldown is active or email is missing
    if (resendCooldown > 0) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: `You can resend code in ${resendCooldown} seconds`,
        props: { forceLight: true },
      });
      return;
    }

    if (!email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Email is required to resend code",
        props: { forceLight: true },
      });
      return;
    }

    // Dispatch resend OTP action
    dispatch(resendOTP({ email: email.trim() }));
  };

  const showFab = code.length === 4;

  return (
    <OnboardingLayout>
      {/* OTP CONTENT */}
      <View style={styles.content}>
        <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
          Enter your 4-digit code
        </Text>

        <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
          We've sent a verification code to{" "}
          <Text style={{ color: "#1E9DF1" }}>{email}</Text>
        </Text>

        <TextInput
          label="Code"
          placeholder="- - - -"
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={4}
          type={2}
          error={codeError}
          forceLight
        />
      </View>

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomActions}>
        {/* Resend Code */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleResendCode}
          disabled={resendOTPLoading || resendCooldown > 0}>
          {resendCooldown > 0 ? (
            <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>
              Resend code in {resendCooldown}s
            </Text>
          ) : (
            <Text
              variant="link"
              style={{ color: resendOTPLoading ? "#9CA3AF" : "#1E9DF1" }}>
              {resendOTPLoading ? "Sending..." : "Resend code"}
            </Text>
          )}
        </TouchableOpacity>

        {/* FAB */}
        {showFab && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.fab}
            onPress={() => handleVerify()}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={"#FFFFFF"} />
            ) : (
              <Icon name="chevron-right" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    // justifyContent: "center",
    marginTop: RFPercentage(25),
    paddingHorizontal: 20,
  },

  title: {
    marginBottom: RFValue(8),
    fontSize: RFValue(20),
  },

  subtitle: {
    marginBottom: RFValue(16),
    lineHeight: RFValue(18),
  },

  bottomActions: {
    position: "absolute",
    left: RFValue(20),
    right: RFValue(20),
    bottom: Platform.OS === "ios" ? RFValue(40) : RFValue(30),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: RFValue(15),
  },

  fab: {
    height: RFValue(45),
    width: RFValue(45),
    borderRadius: RFValue(26),
    backgroundColor: "#1E9DF1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
});

export default OTPVerficationScreen;
