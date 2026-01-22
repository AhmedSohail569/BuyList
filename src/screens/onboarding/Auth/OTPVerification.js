import React, {useEffect, useState} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Text, TextInput} from "~components/Common";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import Icon from "react-native-vector-icons/FontAwesome";
import {useDispatch, useSelector} from "react-redux";
import Toast from "react-native-toast-message";

import {verifyEmail} from "~redux/actions/authActions";
import {clearVerifyEmailState, clearError} from "~redux/reducers/authReducer";
import {validateOTP} from "~utils/validation";

const OTPVerficationScreen = ({navigation, route}) => {
  const {email} = route?.params || {};

  const {emailVerified, loading, error} = useSelector(state => state.auth);

  const dispatch = useDispatch();

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(null);

  // Handle successful email verification
  useEffect(() => {
    if (emailVerified) {
      Toast.show({
        type: "success",
        text1: "Email Verified",
        text2: "Your email has been verified successfully",
      });
      navigation.navigate("Login", {
        email,
        otp: code || "0000",
      });

      dispatch(clearVerifyEmailState());
    }
  }, [emailVerified, navigation, email, code, dispatch]);

  // Handle API errors with toast
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: typeof error === "string" ? error : "Invalid verification code",
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

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
    Toast.show({
      type: "info",
      text1: "Code Resent",
      text2: "A new verification code has been sent to your email",
    });
    console.log("Resend Code");
  };

  const showFab = code.length === 4;

  return (
    <OnboardingLayout>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* OTP CONTENT */}
        <View style={styles.content}>
          <Text variant="sectionTitle" style={styles.title}>
            Enter your 4-digit code
          </Text>

          <Text variant="bodySmall" color="muted" style={styles.subtitle}>
            We've sent a verification code to{" "}
            <Text style={{color: "#1E9DF1"}}>{email}</Text>
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
          />
        </View>

        {/* BOTTOM ACTIONS */}
        <View style={styles.bottomActions}>
          {/* Resend Code */}
          <TouchableOpacity activeOpacity={0.7} onPress={handleResendCode}>
            <Text variant="link" color="primary">
              Resend code
            </Text>
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
      </KeyboardAvoidingView>
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
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
  },
});

export default OTPVerficationScreen;
