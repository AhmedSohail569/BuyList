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
import {verifyEmail} from "~redux/actions/authActions";
import {clearVerifyEmailState} from "~redux/reducers/authReducer";

const OTPVerficationScreen = ({navigation, route}) => {
  const {email} = route?.params || {};

  const {emailVerified, loading} = useSelector(state => state.auth);

  const dispatch = useDispatch();

  const [code, setCode] = useState("");

  useEffect(() => {
    if (emailVerified) {
      navigation.navigate("Login", {
        email,
        otp: code || "0000",
      });

      dispatch(clearVerifyEmailState());
    }
  }, [emailVerified, navigation]);

  const handleVerify = () => {
    dispatch(
      verifyEmail({
        email: email,
        otp: code,
      }),
    );
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

          <TextInput
            label="Code"
            placeholder="- - - -"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
            type={2}
          />
        </View>

        {/* BOTTOM ACTIONS */}
        <View style={styles.bottomActions}>
          {/* Resend Code */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              // 🔁 resend OTP logic
              console.log("Resend Code");
            }}>
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
    marginBottom: RFValue(12),
    fontSize: RFValue(20),
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
