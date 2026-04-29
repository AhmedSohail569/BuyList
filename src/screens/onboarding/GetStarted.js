import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { Text, TextInput } from "~components/Common";
import { Images } from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import Icon from "react-native-vector-icons/FontAwesome";
import { useState, useCallback, useRef } from "react";
import { FontFamily } from "~theme/fonts";
import { useDispatch, useSelector } from "react-redux";
import { signInWithGoogle } from "~utils/googleAuth";
import { signInWithApple } from "~utils/appleAuth";
import { googleLogin } from "~redux/actions/googleAuthActions";
import { appleLogin } from "~redux/actions/appleAuthActions";
import Toast from "react-native-toast-message";
import { ActivityIndicator } from "react-native";
import { checkPhoneExists } from "~redux/actions/authActions";
import useTranslation from "~hooks/useTranslation";
import { checkConnectivity, showNoInternetToast } from "~utils/network";

const GetStartedScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const inputRef   = useRef(null);
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const dispatch = useDispatch();
  const { loading, checkPhoneLoading } = useSelector((state) => state.auth);

  const handleGoogleLogin = async () => {
    // Check connectivity
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      showNoInternetToast();
      return;
    }

    try {
      const userInfo = await signInWithGoogle();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      const user = userInfo.data?.user || userInfo.user;
      
      if (!idToken) throw new Error("No profile fetched from Google");
      
      await dispatch(googleLogin({ token: idToken, user })).unwrap();
    } catch (error) {
      if (error.message !== "User cancelled the login flow.") {
        Toast.show({
          type: "error",
          text1: t("getstarted_google_failed"),
          text2: error.message || t("common_unexpected_error"),
        });
      }
    }
  };

  const handleAppleLogin = async () => {
    // Check connectivity
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      showNoInternetToast();
      return;
    }

    try {
      const authResponse = await signInWithApple();
      const { identityToken, fullName, email } = authResponse;
      
      if (!identityToken) throw new Error("No identity token returned from Apple");

      await dispatch(appleLogin({ token: identityToken, fullName, email })).unwrap();
    } catch (error) {
      if (error.message !== "User cancelled the login flow.") {
        Toast.show({
          type: "error",
          text1: t("getstarted_apple_failed"),
          text2: error.message || t("common_unexpected_error"),
        });
      }
    }
  };

  const handlePhoneSubmit = useCallback(
    async (phoneData) => {
      // Check connectivity
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        showNoInternetToast();
        return;
      }

      if (!phoneData || phoneData.fullPhone.trim().length < 5) {
        Toast.show({
          type: "error",
          text1: t("getstarted_invalid_phone"),
          text2: t("getstarted_invalid_phone_desc"),
        });
        return;
      }

      try {
        const result = await dispatch(checkPhoneExists({ phone: phoneData.fullPhone })).unwrap();
        
        if (result?.exists) {
          Toast.show({
            type: "error",
            text1: t("getstarted_phone_exists"),
            text2: t("getstarted_phone_exists_desc"),
          });
          return;
        }

        navigation.navigate("SelectLocation", { phone: phoneData });
      } catch (err) {
        Toast.show({
          type: "error",
          text1: t("getstarted_error"),
          text2: err || t("getstarted_error_desc"),
        });
      }
    },
    [navigation, dispatch],
  );

  // When the phone input receives focus, scroll just enough to reveal it.
  // We scroll to the input's Y position inside the ScrollView so only
  // the input comes into view — the buttons/social section stays hidden
  // behind the keyboard, which looks natural and graceful.
  const handleInputFocus = useCallback(() => {
    if (inputRef.current && scrollRef.current) {
      // Small delay so the keyboard has started appearing
      setTimeout(() => {
        inputRef.current?.measureLayout(
          scrollRef.current?.getScrollableNode?.() ?? scrollRef.current,
          (x, y) => {
            scrollRef.current?.scrollTo({ y: y - RFValue(16), animated: true });
          },
          () => {
            // Fallback: just scroll a fixed amount on Android
            if (Platform.OS === "android") {
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          },
        );
      }, 150);
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    // Scroll back to bottom when keyboard dismisses
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  return (
    <OnboardingLayout>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        // iOS: native inset adjustment — only scrolls just enough for the input
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        // Android: be careful not to resize the whole layout
        keyboardDismissMode="interactive">
        {/* Background hero image */}
        <Image
          source={Images.getStartedBg}
          style={{ height: RFPercentage(50), width: "100%", position: "absolute" }}
          resizeMode="stretch"
        />

        <View
          style={[styles.content, { paddingBottom: insets.bottom + RFValue(24) }]}>
          {/* Title */}
          <Text variant="sectionTitle" style={[styles.title, { color: "#1B1A1F" }]}>
            {t("getstarted_title")}
          </Text>

          {/* Phone input — ref used to measure position for scroll */}
          <View ref={inputRef} collapsable={false}>
            <TextInput
              type={3}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={15}
              forceLight
              loading={checkPhoneLoading}
              onSubmitPhone={handlePhoneSubmit}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </View>

          {/* Subtitle */}
          <Text
            variant="bodySmall"
            align="center"
            style={[styles.subtitle, { color: "#9CA3AF" }]}>
            {t("getstarted_subtitle")}
          </Text>

          <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: "#5383EC" }]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" style={{ width: RFValue(30), height: RFValue(30) }} />
            ) : (
              <>
                <Icon name="google" size={30} color={"#FFFFFF"} />
                <Text variant="bodySmall" style={[styles.textStyle, { color: "#FFFFFF" }]}>
                  {t("getstarted_google")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === "ios" && <TouchableOpacity 
            style={[styles.socialButton, { backgroundColor: "#000000" }]}
            onPress={handleAppleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" style={{ width: RFValue(30), height: RFValue(30) }} />
            ) : (
              <>
                <Icon name="apple" size={30} color={"#FFFFFF"} />
                <Text variant="bodySmall" style={[styles.textStyle, { color: "#FFFFFF" }]}>
                  {t("getstarted_apple")}
                </Text>
              </>
            )}
          </TouchableOpacity>}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Text variant="bodySmall" style={[styles.textStyle, { color: "#9CA3AF" }]}>
              {t("getstarted_have_account")}
            </Text>
            <Text
              variant="link"
              onPress={() => navigation.replace("Login")}
              style={[styles.textStyle, { color: "#1E9DF1", fontFamily: FontFamily.regular }]}>
              {t("getstarted_login")}
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
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },

  title: {
    marginBottom: 8,
    fontSize: RFValue(20),
  },

  subtitle: {
    marginVertical: RFValue(20),
  },

  socialButton: {
    marginBottom: RFValue(15),
    paddingVertical: RFValue(5),
    borderRadius: RFValue(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: RFValue(20),
  },

  textStyle: {
    marginVertical: RFValue(10),
  },
});

export default GetStartedScreen;
