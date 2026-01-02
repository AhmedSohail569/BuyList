import React, {useState} from "react";
import {TouchableOpacity, Text, StyleSheet, View} from "react-native";
import CountryPicker from "react-native-country-picker-modal";
import {RFValue} from "react-native-responsive-fontsize";

const CountryPickerButton = ({onSelect}) => {
  const [countryCode, setCountryCode] = useState("PK");
  const [callingCode, setCallingCode] = useState("92");
  const [visible, setVisible] = useState(false);

  const handleSelect = country => {
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
      activeOpacity={0.7}
      style={styles.container}
      onPress={() => setVisible(true)}>
      <CountryPicker
        withFilter
        withFlag
        withCallingCode
        withEmoji
        countryCode={countryCode}
        visible={visible}
        onClose={() => setVisible(false)}
        onSelect={handleSelect}
      />

      <Text style={styles.text}>+{callingCode}</Text>
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
    color: "#111827",
    fontWeight: "500",
  },
});

export default CountryPickerButton;
