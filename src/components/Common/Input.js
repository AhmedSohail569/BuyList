import { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import PropTypes from "prop-types";
import { RFValue } from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Feather";
import CountryPickerButton from "~components/CountryPickerButton";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";

// Light mode colors for forceLight prop
const lightModeColors = {
  inputBackground: "#FFFFFF",
  inputBorder: "#E5E7EB",
  inputText: "#111827",
  inputPlaceholder: "#9AA0A6",
  inputDisabled: "#F3F4F6",
  iconMuted: "#9CA3AF",
  textSecondary: "#6B7280",
  error: "#EF4444",
};


const Input = ({
  type = 1,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  secureTextEntry = false,
  editable = true,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  multiline = false,
  maxLength = 120,
  numberOfLines = 1,
  forceLight = false,
  // Phone-specific props (type 3)
  onSubmitPhone,
}) => {
  const { colors, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  const [country, setCountry] = useState({
    callingCode: "44",
    countryCode: "GB",
  });

  // Use light mode colors if forceLight is true
  const activeColors = forceLight ? lightModeColors : colors;
  const effectiveIsDark = forceLight ? false : isDark;

  const handleChangeText = useCallback(
    (text) => {
      if (type === 3) {
        const rawDigits = text.replace(/\D/g, "");
        onChangeText({
          phoneNumber: rawDigits,
          callingCode: country.callingCode,
          countryCode: country.countryCode,
          fullPhone: `+${country.callingCode}${rawDigits}`,
        });
      } else {
        onChangeText(text);
      }
    },
    [type, country, onChangeText],
  );

  // Whether the inline submit button should appear (type 3 only)
  const rawPhone = type === 3 ? (value?.phoneNumber || "") : "";
  const showInlineSubmit = type === 3 && rawPhone.length > 0 && !!onSubmitPhone;

  // Dynamic styles based on theme
  const themedStyles = {
    label: {
      color: effectiveIsDark ? activeColors.textSecondary : "#6B7280",
    },
    inputWrapper1: {
      backgroundColor: activeColors.inputBackground,
      borderColor: error ? activeColors.error : activeColors.inputBorder,
    },
    inputWrapper2: {
      backgroundColor: "transparent",
      borderBottomColor: error ? activeColors.error : activeColors.inputBorder,
    },
    input: {
      color: activeColors.inputText,
    },
    disabled: {
      backgroundColor: activeColors.inputDisabled,
    },
    iconColor: activeColors.iconMuted,
  };

  // ── Type 3: Full phone number input ──────────────────────────────────────
  if (type === 3) {

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, themedStyles.label]}>{label}</Text>}

        <View
          style={[
            styles.phoneWrapper,
            {
              backgroundColor: activeColors.inputBackground,
              borderColor: error ? activeColors.error : activeColors.inputBorder,
            },
          ]}>
          {/* Country picker (flag + calling code) */}
          <CountryPickerButton
            onSelect={(data) => setCountry(data)}
            forceLight={forceLight}
          />

          {/* Separator */}
          <View
            style={[
              styles.phoneSeparator,
              { backgroundColor: activeColors.inputBorder },
            ]}
          />

          {/* Formatted phone input */}
          <TextInput
            value={rawPhone}
            maxLength={maxLength}
            onChangeText={handleChangeText}
            placeholder={placeholder || "Phone No."}
            placeholderTextColor={activeColors.inputPlaceholder}
            keyboardType="number-pad"
            autoCapitalize="none"
            editable={editable}
            style={[styles.phoneInput, { color: activeColors.inputText }, inputStyle]}
            returnKeyType="done"
          />

          {/* Inline submit arrow (replaces FAB) */}
          {showInlineSubmit && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.inlineSubmitBtn}
              onPress={() => onSubmitPhone(value)}>
              <Icon name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {error && (
          <Text style={[styles.errorText, { color: activeColors.error }]}>{error}</Text>
        )}
      </View>
    );
  }

  // ── Type 1 & 2: Standard text input ──────────────────────────────────────
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, themedStyles.label]}>{label}</Text>}

      <View
        style={[
          type === 1 ? styles.inputWrapper1 : styles.inputWrapper2,
          type === 1 ? themedStyles.inputWrapper1 : themedStyles.inputWrapper2,
          error && styles.errorBorder,
          !editable && type !== 3 && themedStyles.disabled,
        ]}>
        {leftIcon && type === 1 && (
          <Icon
            name={leftIcon}
            size={18}
            color={themedStyles.iconColor}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          maxLength={maxLength}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={activeColors.inputPlaceholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !showPassword}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            themedStyles.input,
            multiline && styles.multiline,
            inputStyle,
          ]}
          returnKeyType="done"
        />

        {(isPassword || rightIcon) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              isPassword ? setShowPassword(!showPassword) : onRightIconPress?.()
            }>
            <Icon
              name={isPassword ? (showPassword ? "eye-off" : "eye") : rightIcon}
              size={18}
              color={themedStyles.iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: activeColors.error }]}>{error}</Text>
      )}
    </View>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onChangeText: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    fontWeight: "600",
    marginBottom: 6,
  },

  // ── Type 1 ──
  inputWrapper1: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  // ── Type 2 ──
  inputWrapper2: {
    height: 56,
    borderWidth: 0.5,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

  // ── Type 3 (phone) ──
  phoneWrapper: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  phoneSeparator: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },

  phoneInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },

  inlineSubmitBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1E9DF1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // ── Common ──
  input: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    paddingVertical: 0,
    textAlignVertical: "center",
  },

  multiline: {
    paddingVertical: 12,
    textAlignVertical: "top",
  },

  leftIcon: {
    marginRight: 10,
  },

  errorText: {
    marginTop: 6,
    fontSize: RFValue(10),
  },

  errorBorder: {},
});

export default Input;
