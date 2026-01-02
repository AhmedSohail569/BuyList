import {View, StyleSheet, Image} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import {RFPercentage, RFValue} from "react-native-responsive-fontsize";
import {Button, Text, TextInput} from "~components/Common";
import {Images} from "~assets";
import OnboardingLayout from "~containers/layouts/OnboardingLayout";
import {useState} from "react";

const SelectLocationScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <OnboardingLayout>
      <Image
        source={Images.location}
        style={{
          width: RFValue(180),
          height: RFValue(180),
          alignSelf: "center",
          marginTop: RFPercentage(10),
          position: "absolute",
        }}
        resizeMode="contain"
      />
      <View
        style={[styles.content, {paddingBottom: insets.bottom + RFValue(24)}]}>
        {/* Title */}
        <View>
          <Text variant="sectionTitle" align="center" style={styles.title}>
            Select Your Location
          </Text>

          {/* Subtitle */}
          <Text
            variant="bodySmall"
            color="muted"
            align="center"
            style={styles.subtitle}>
            Switch on your location to stay in tune with what’s happening in
            your area
          </Text>
        </View>

        <View>
          <TextInput
            label="Your Zone"
            placeholder="samrana@example.com"
            value={email}
            onChangeText={setEmail}
            type={2}
          />

          <TextInput
            label="Your Area"
            placeholder="Types of your area"
            value={password}
            onChangeText={setPassword}
            type={2}
          />

          {/* Button */}
          <Button
            title="Submit"
            onPress={() => navigation.navigate("Signup")}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
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
});

export default SelectLocationScreen;
