import React, {useState} from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import PropTypes from "prop-types";
import {RFValue} from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Feather";
import CountryPickerButton from "~components/CountryPickerButton";

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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  const [country, setCountry] = useState({
    callingCode: "92",
    countryCode: "PK",
  });

  const handleChangeText = text => {
    if (type === 3) {
      onChangeText({
        phoneNumber: text,
        callingCode: country.callingCode,
        countryCode: country.countryCode,
        fullPhone: `+${country.callingCode}${text}`,
      });
    } else {
      onChangeText(text);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          type === 1 ? styles.inputWrapper1 : styles.inputWrapper2,
          error && styles.errorBorder,
          !editable && type !== 3 && styles.disabled,
        ]}>
        {leftIcon && type === 1 && (
          <Icon
            name={leftIcon}
            size={18}
            color="#9AA0A6"
            style={styles.leftIcon}
          />
        )}

        {type === 3 && (
          <CountryPickerButton onSelect={data => setCountry(data)} />
        )}

        <TextInput
          value={value}
          maxLength={maxLength}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA0A6"
          keyboardType={type === 3 ? "numeric" : keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isPassword && !showPassword}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, multiline && styles.multiline, inputStyle]}
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
              color="#9AA0A6"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    fontSize: RFValue(11),
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },

  inputWrapper1: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  inputWrapper2: {
    height: 56,
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: RFValue(12),
    color: "#111827",
    paddingVertical: 0, // IMPORTANT
    textAlignVertical: "center", // ANDROID FIX
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
    color: "#EF4444",
  },

  errorBorder: {
    // borderColor: "#EF4444",
  },

  disabled: {
    backgroundColor: "#F3F4F6",
  },
});

export default Input;
