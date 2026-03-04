import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import CountryPicker from "react-native-country-picker-modal";
import { RFValue } from "react-native-responsive-fontsize";
import { useTheme } from "~context/ThemeContext";

// Light mode colors for forceLight prop
const lightModeColors = {
  textPrimary: "#1B1A1F",
  modalBackground: "#FFFFFF",
  inputPlaceholder: "#9AA0A6",
  border: "#E5E7EB",
};

const CountryPickerButton = ({ onSelect, forceLight = false, disabled = false }) => {
  const { colors, isDark } = useTheme();
  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [visible, setVisible] = useState(false);

  // Use light mode colors if forceLight is true
  const activeColors = forceLight ? lightModeColors : colors;
  const effectiveIsDark = forceLight ? false : isDark;

  const handleSelect = country => {
    if (disabled) return;
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);

    onSelect?.({
      countryCode: country.cca2,
      callingCode: country.callingCode[0],
      flag: country.flag,
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      style={styles.container}
      onPress={() => !disabled && setVisible(true)}
      disabled={disabled}>
      <CountryPicker

        withFilter
        withFlag
        withCallingCode
        withEmoji
        countryCode={countryCode}
        visible={visible}
        onClose={() => setVisible(false)}
        onSelect={handleSelect}
        theme={effectiveIsDark ? {
          backgroundColor: activeColors.modalBackground,
          onBackgroundTextColor: activeColors.textPrimary,
          filterPlaceholderTextColor: activeColors.inputPlaceholder,
          primaryColorVariant: activeColors.border,
        } : undefined}
      />

      <Text style={[styles.text, { color: activeColors.textPrimary }]}>+{callingCode}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  text: {
    fontSize: RFValue(12),
    marginLeft: 6,
    fontWeight: "500",
  },
});

export default CountryPickerButton;
