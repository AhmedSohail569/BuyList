import { useEffect, useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";

import { Button, Text, TextInput } from "~components/Common";
import { Images } from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {
  clearError,
  clearForgotPassword,
  clearResetPasswordState,
  clearVerifyTokenMessage,
  clearResendResetOTPState,
} from "~redux/reducers/authReducer";
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
  resendResetOTP,
} from "~redux/actions/authActions";
import {
  validateEmail,
  validateOTP,
  validatePassword,
  validateConfirmPassword,
} from "~utils/validation";

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const {
    loading,
    error,
    forgotPasswordMessage,
    resetTokenValid,
    resetPasswordMessage,
    resendResetOTPLoading,
    resendResetOTPMessage,
    resendResetOTPError,
  } = useSelector(state => state.auth);

  // --- Local State ---
  // Step 0: Email Input
  // Step 1: OTP Verification
  // Step 2: New Password Input
  // Step 3: Success Screen
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Field-level errors
  const [errors, setErrors] = useState({
    email: null,
    otp: null,
    newPassword: null,
    confirmPassword: null,
  });

  // --- Lifecycle: Cleanup on Mount ---
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearForgotPassword());
    dispatch(clearResetPasswordState());
    dispatch(clearVerifyTokenMessage());
    dispatch(clearResendResetOTPState());
    setResendCooldown(0);
  }, [dispatch]);

  // --- Step 0: Handle Forgot Password Response ---
  useEffect(() => {
    if (step === 0 && forgotPasswordMessage) {
      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: forgotPasswordMessage,
        props: { forceLight: true },
      });
      setStep(1);
      dispatch(clearForgotPassword());
    }
  }, [forgotPasswordMessage, step, dispatch]);

  // --- Step 1: Handle Verify Token Response ---
  useEffect(() => {
    if (step === 1 && resetTokenValid === true) {
      Toast.show({
        type: "success",
        text1: "Code Verified",
        text2: "Please create a new password",
        props: { forceLight: true },
      });
      setStep(2);
      dispatch(clearVerifyTokenMessage());
    }
  }, [resetTokenValid, step, dispatch]);

  // --- Step 2: Handle Reset Password Response ---
  useEffect(() => {
    if (step === 2 && resetPasswordMessage) {
      setStep(3);
      dispatch(clearResetPasswordState());
    }
  }, [resetPasswordMessage, step, dispatch]);

  // --- Global Error Handling ---
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: typeof error === "string" ? error : "Something went wrong",
        props: { forceLight: true },
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Handle Resend Reset OTP Success ---
  useEffect(() => {
    if (step === 1 && resendResetOTPMessage) {
      Toast.show({
        type: "success",
        text1: "Code Resent",
        text2: resendResetOTPMessage,
        props: { forceLight: true },
      });
      // Set cooldown timer (60 seconds)
      setResendCooldown(60);
      dispatch(clearResendResetOTPState());
    }
  }, [resendResetOTPMessage, step, dispatch]);

  // --- Handle Resend Reset OTP Error ---
  useEffect(() => {
    if (resendResetOTPError) {
      Toast.show({
        type: "error",
        text1: "Resend Failed",
        text2:
          typeof resendResetOTPError === "string"
            ? resendResetOTPError
            : "Failed to resend code",
        props: { forceLight: true },
      });
      dispatch(clearResendResetOTPState());
    }
  }, [resendResetOTPError, dispatch]);

  // --- Cooldown Timer Countdown ---
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

  // Reset cooldown when step changes to OTP verification
  useEffect(() => {
    if (step === 1) {
      // Reset cooldown when entering OTP step
      setResendCooldown(0);
    }
  }, [step]);

  // --- Input Handlers with error clearing ---
  const handleEmailChange = value => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  const handleOtpChange = value => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");
    setOtp(numericValue);
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: null }));
    }
  };

  const handleNewPasswordChange = value => {
    setNewPassword(value);
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: null }));
    }
  };

  const handleConfirmPasswordChange = value => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: null }));
    }
  };

  // --- Action Handlers ---

  const handleSendOTP = () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: emailError,
        props: { forceLight: true },
      });
      return;
    }
    dispatch(forgotPassword({ email: email.trim() }));
  };

  const handleVerifyOTP = () => {
    const otpError = validateOTP(otp);
    if (otpError) {
      setErrors(prev => ({ ...prev, otp: otpError }));
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: otpError,
        props: { forceLight: true },
      });
      return;
    }
    dispatch(verifyResetToken({ email: email.trim(), otp }));
  };

  const handleUpdatePassword = () => {
    const newPasswordError = validatePassword(newPassword, false);
    const confirmPasswordError = validateConfirmPassword(
      newPassword,
      confirmPassword,
    );

    if (newPasswordError || confirmPasswordError) {
      setErrors(prev => ({
        ...prev,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError,
      }));
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: newPasswordError || confirmPasswordError,
        props: { forceLight: true },
      });
      return;
    }

    dispatch(
      resetPassword({
        email: email.trim(),
        otp,
        newPassword,
        confirmPassword,
      }),
    );
  };

  const handleResendOTP = () => {
    // Prevent resend if cooldown is active
    if (resendCooldown > 0) {
      Toast.show({
        type: "info",
        text1: "Please wait",
        text2: `You can resend code in ${resendCooldown} seconds`,
        props: { forceLight: true },
      });
      return;
    }

    // Validate email
    if (!email || !email.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Email is required to resend code",
        props: { forceLight: true },
      });
      return;
    }

    // Dispatch resend reset OTP action
    dispatch(resendResetOTP({ email: email.trim() }));
  };

  const goBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
      dispatch(clearError());
      // Clear errors for the step we're going back to
      if (step === 1) {
        setErrors(prev => ({ ...prev, otp: null }));
      } else if (step === 2) {
        setErrors(prev => ({ ...prev, newPassword: null, confirmPassword: null }));
      }
    } else {
      navigation.goBack();
    }
  };

  return (
    <OnboardingLayout>
      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={goBack}
        activeOpacity={0.7}>
        <Icon name="chevron-back" size={28} color="#1B1A1F" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={Images.buyListIconBlue}
        style={styles.logo}
        resizeMode="contain"
      />

      <View
        style={[styles.content, { paddingBottom: insets.bottom + RFValue(24) }]}>
        <View>
          {/* Step 1: Email */}
          {step === 0 && (
            <>
              <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
                Forgot your Password
              </Text>
              <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
                No worries, it happens to everyone. Enter your email below to
                reset your password.
              </Text>
              <TextInput
                label="Email"
                placeholder="samrana@example.com"
                value={email}
                onChangeText={handleEmailChange}
                leftIcon="mail"
                keyboardType="email-address"
                autoCapitalize="none"
                type={2}
                error={errors.email}
                forceLight
              />
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                forceLight
              />
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 1 && (
            <>
              <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
                Enter Verification Code
              </Text>
              <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
                Please enter the OTP to verify your account. A code has been
                sent to <Text style={{ color: "#1E9DF1" }}>{email}</Text>
              </Text>
              <TextInput
                label="Code"
                placeholder="- - - -"
                value={otp}
                onChangeText={handleOtpChange}
                maxLength={4}
                keyboardType="numeric"
                inputStyle={{
                  letterSpacing: 8,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
                error={errors.otp}
                forceLight
              />
              <Button
                title="Verify"
                onPress={handleVerifyOTP}
                loading={loading}
                forceLight
              />
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendOTP}
                disabled={resendResetOTPLoading || resendCooldown > 0}>
                <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>
                  Didn't get code?{" "}
                </Text>
                {resendCooldown > 0 ? (
                  <Text variant="bodySmall" style={{ color: "#9CA3AF" }}>
                    Resend in {resendCooldown}s
                  </Text>
                ) : (
                  <Text variant="bodySmall" style={[styles.resendText, { color: "#1E9DF1" }]}>
                    {resendResetOTPLoading ? "Sending..." : "Resend"}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 2 && (
            <>
              <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
                Create A New Password
              </Text>
              <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
                Please choose a password that hasn't been used before. Must be
                at least 8 characters.
              </Text>
              <TextInput
                label="Set new password"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                error={errors.newPassword}
                forceLight
              />
              <TextInput
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                onRightIconPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={{ marginTop: RFValue(16) }}
                error={errors.confirmPassword}
                forceLight
              />
              <Button
                title="Update"
                onPress={handleUpdatePassword}
                loading={loading}
                forceLight
              />
            </>
          )}

          {/* Step 4: Success */}
          {step === 3 && (
            <View style={styles.successContainer}>
              <Image
                source={Images.successIcon}
                style={{
                  width: RFValue(60),
                  height: RFValue(60),
                  alignSelf: "flex-start",
                }}
              />

              <Text
                variant="sectionTitle"
                align="left"
                style={[styles.successTitle, { color: "#1B1A1F" }]}>
                Password Reset!
              </Text>
              <Text variant="bodySmall" style={[styles.subtitle, { color: "#9CA3AF" }]}>
                Your password has been successfully reset. Click below to
                continue to login page.
              </Text>
              <Button
                title="Continue"
                onPress={() => navigation.navigate("Login")}
                loading={loading}
                forceLight
              />
            </View>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: RFValue(40),
    left: RFValue(10),
    zIndex: 10,
    padding: RFValue(8),
  },
  logo: {
    width: RFValue(50),
    height: RFValue(50),
    alignSelf: "center",
    marginTop: RFPercentage(15),
    marginBottom: RFPercentage(5),
  },
  content: {
    // flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: RFPercentage(5),
  },
  title: {
    marginBottom: 8,
    fontSize: RFValue(20),
    fontWeight: "600",
  },
  subtitle: {
    marginBottom: RFValue(20),
    lineHeight: RFValue(20),
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: RFValue(16),
  },
  resendText: {
    fontWeight: "600",
  },
  successContainer: {
    // alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    fontSize: RFValue(18),
    marginBottom: RFValue(8),
  },
});

export default ForgotPasswordScreen;
