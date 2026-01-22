import {useEffect, useState} from "react";
import {View, StyleSheet, Image, TouchableOpacity} from "react-native";

import {useDispatch, useSelector} from "react-redux";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";

import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {
  clearError,
  clearForgotPassword,
  clearResetPasswordState,
  clearVerifyTokenMessage,
} from "~redux/reducers/authReducer";
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "~redux/actions/authActions";
import {
  validateEmail,
  validateOTP,
  validatePassword,
  validateConfirmPassword,
} from "~utils/validation";

const ForgotPasswordScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const {
    loading,
    error,
    forgotPasswordMessage,
    resetTokenValid,
    resetPasswordMessage,
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
  }, [dispatch]);

  // --- Step 0: Handle Forgot Password Response ---
  useEffect(() => {
    if (step === 0 && forgotPasswordMessage) {
      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: forgotPasswordMessage,
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
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // --- Input Handlers with error clearing ---
  const handleEmailChange = value => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({...prev, email: null}));
    }
  };

  const handleOtpChange = value => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");
    setOtp(numericValue);
    if (errors.otp) {
      setErrors(prev => ({...prev, otp: null}));
    }
  };

  const handleNewPasswordChange = value => {
    setNewPassword(value);
    if (errors.newPassword) {
      setErrors(prev => ({...prev, newPassword: null}));
    }
  };

  const handleConfirmPasswordChange = value => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: null}));
    }
  };

  // --- Action Handlers ---

  const handleSendOTP = () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors(prev => ({...prev, email: emailError}));
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: emailError,
      });
      return;
    }
    dispatch(forgotPassword({email: email.trim()}));
  };

  const handleVerifyOTP = () => {
    const otpError = validateOTP(otp);
    if (otpError) {
      setErrors(prev => ({...prev, otp: otpError}));
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: otpError,
      });
      return;
    }
    dispatch(verifyResetToken({email: email.trim(), otp}));
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
    dispatch(forgotPassword({email: email.trim()}));
    Toast.show({
      type: "info",
      text1: "Code Resent",
      text2: "A new verification code has been sent",
    });
  };

  const goBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
      dispatch(clearError());
      // Clear errors for the step we're going back to
      if (step === 1) {
        setErrors(prev => ({...prev, otp: null}));
      } else if (step === 2) {
        setErrors(prev => ({...prev, newPassword: null, confirmPassword: null}));
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
        <Icon name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={Images.buyListIconBlue}
        style={styles.logo}
        resizeMode="contain"
      />

      <View
        style={[styles.content, {paddingBottom: insets.bottom + RFValue(24)}]}>
        <View>
          {/* Step 1: Email */}
          {step === 0 && (
            <>
              <Text variant="sectionTitle" style={styles.title}>
                Forgot your Password
              </Text>
              <Text variant="bodySmall" color="muted" style={styles.subtitle}>
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
              />
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
              />
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 1 && (
            <>
              <Text variant="sectionTitle" style={styles.title}>
                Enter Verification Code
              </Text>
              <Text variant="bodySmall" color="muted" style={styles.subtitle}>
                Please enter the OTP to verify your account. A code has been
                sent to <Text style={{color: "#1E9DF1"}}>{email}</Text>
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
              />
              <Button
                title="Verify"
                onPress={handleVerifyOTP}
                loading={loading}
              />
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendOTP}>
                <Text variant="bodySmall" color="muted">
                  Didn't get code?{" "}
                </Text>
                <Text variant="bodySmall" style={styles.resendText}>
                  Resend
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 2 && (
            <>
              <Text variant="sectionTitle" style={styles.title}>
                Create A New Password
              </Text>
              <Text variant="bodySmall" color="muted" style={styles.subtitle}>
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
                style={{marginTop: RFValue(16)}}
                error={errors.confirmPassword}
              />
              <Button
                title="Update"
                onPress={handleUpdatePassword}
                loading={loading}
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
                style={styles.successTitle}>
                Password Reset!
              </Text>
              <Text variant="bodySmall" color="muted" style={styles.subtitle}>
                Your password has been successfully reset. Click below to
                continue to login page.
              </Text>
              <Button
                title="Continue"
                onPress={() => navigation.navigate("Login")}
                loading={loading}
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
    color: "#1E9DF1",
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
