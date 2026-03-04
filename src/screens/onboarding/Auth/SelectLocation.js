import { useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Feather";

import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { Button, Text, TextInput } from "~components/Common";
import { Images } from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import useLocation from "~hooks/useLocation";
import { setLocation } from "~redux/reducers/locationReducer";

const SelectLocationScreen = ({ navigation, route }) => {
  const { phone } = route?.params || {};
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  // Location hook
  const {
    detectLocation,
    loading: locationLoading,
    error: locationError,
    clearError,
  } = useLocation();

  // Form state (allows manual override)
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [detected, setDetected] = useState(false);

  /**
   * Show toast when location detection fails
   */
  useEffect(() => {
    if (locationError) {
      Toast.show({
        type: "error",
        text1: "Location Error",
        text2: locationError,
        props: { forceLight: true },
      });
      clearError();
    }
  }, [locationError, clearError]);

  /**
   * Detect location: permission → position → reverse geocode
   */
  const handleDetectLocation = useCallback(async () => {
    const result = await detectLocation();
    console.log("result", result);
    if (result) {
      setCity(result.city);
      setArea(result.area);
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      setDetected(true);

      Toast.show({
        type: "success",
        text1: "Location Detected",
        text2: result.city
          ? `${result.area ? result.area + ", " : ""}${result.city}`
          : "Location coordinates saved",
        props: { forceLight: true },
      });
    }
  }, [detectLocation]);

  /**
   * Handle submit: save location to Redux and navigate to Signup
   */
  const handleSubmit = useCallback(() => {
    if (!city.trim() && !area.trim() && !coords) {
      Toast.show({
        type: "error",
        text1: "Location Required",
        text2: "Please detect your location or enter it manually",
        props: { forceLight: true },
      });
      return;
    }

    // Persist location to Redux
    dispatch(
      setLocation({
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        city: city.trim(),
        area: area.trim(),
      }),
    );

    navigation.navigate("Signup", {
      phone,
      zone: city.trim(),
      area: area.trim(),
    });
  }, [city, area, coords, dispatch, navigation, phone]);

  const isLoading = locationLoading;

  return (
    <OnboardingLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          automaticallyAdjustKeyboardInsets>
      <Image
        source={Images.location}
        style={styles.backgroundImage}
        resizeMode="contain"
      />

      <View
        style={[styles.content, { paddingBottom: insets.bottom + RFValue(24) }]}>
        {/* Header */}
        <View style={{ paddingHorizontal: RFValue(18) }}>
          <Text
            variant="sectionTitle"
            align="center"
            style={[styles.title, { color: "#1B1A1F" }]}>
            Select Your Location
          </Text>

          <Text
            variant="bodySmall"
            align="center"
            style={[styles.subtitle, { color: "#9CA3AF" }]}>
            Switch on your location to stay in tune with what's happening in
            your area
          </Text>
        </View>

        {/* Form */}
        <View>
          {/* Detect Location Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDetectLocation}
            disabled={isLoading}
            style={styles.detectButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#1E9DF1" />
            ) : (
              <Icon name="crosshair" size={RFValue(16)} color="#1E9DF1" />
            )}
            <Text
              variant="bodySmall"
              style={styles.detectButtonText}>
              {isLoading
                ? "Detecting location..."
                : detected
                  ? "Re-detect my location"
                  : "Detect my location"}
            </Text>
          </TouchableOpacity>

          <TextInput
            label="Your City"
            placeholder="e.g. Lahore"
            value={city}
            onChangeText={setCity}
            maxLength={50}
            type={2}
            forceLight
            editable={!isLoading}
          />

          <TextInput
            label="Your Area"
            placeholder="e.g. Gulberg, DHA"
            value={area}
            onChangeText={setArea}
            maxLength={50}
            type={2}
            forceLight
            editable={!isLoading}
          />

          {/* Coordinates indicator */}
          {coords && (
            <View style={styles.coordsRow}>
              <Icon name="map-pin" size={RFValue(12)} color="#9CA3AF" />
              <Text variant="caption" style={styles.coordsText}>
                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <Button
            title="Submit"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            forceLight
          />
        </View>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    width: RFValue(180),
    height: RFValue(180),
    alignSelf: "center",
    marginTop: RFPercentage(10),
    position: "absolute",
  },

  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: RFPercentage(40),
  },

  title: {
    marginBottom: 8,
    fontSize: RFValue(20),
  },

  subtitle: {
    marginBottom: RFValue(20),
  },

  detectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFValue(12),
    marginBottom: RFValue(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
  },

  detectButtonText: {
    marginLeft: RFValue(8),
    color: "#1E9DF1",
    fontWeight: "600",
    fontSize: RFValue(12),
  },

  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFValue(16),
    paddingVertical: RFValue(4),
  },

  coordsText: {
    marginLeft: RFValue(6),
    color: "#9CA3AF",
    fontSize: RFValue(10),
  },
});

export default SelectLocationScreen;
