import {View, StyleSheet, Image, TouchableOpacity, Alert} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import Icon from "react-native-vector-icons/Ionicons";
import {useState} from "react";

const ForgotPasswordScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  // Step states: 0 = email, 1 = otp, 2 = new password, 3 = success
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(1);
    }, 1500);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }
    if (otp.length < 4) {
      Alert.alert("Error", "Verification code must be at least 4 characters");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const handleContinue = () => {
    navigation.navigate("Login");
  };

  const handleResendOTP = () => {
    Alert.alert("Resend OTP", "A new OTP has been sent to " + email);
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
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
                onChangeText={setEmail}
                leftIcon="mail"
                type={2}
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
                onChangeText={setOtp}
                maxLength={4}
                keyboardType="numeric"
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
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
              <TextInput
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                onRightIconPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                style={{marginTop: RFValue(16)}}
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
                onPress={handleContinue}
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
