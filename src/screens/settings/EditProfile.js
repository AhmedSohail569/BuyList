import React, {useState} from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
// Lucide is only used for the Camera icon on the avatar now
import {Camera} from "lucide-react-native";
import Header from "~components/Header";
import {ScrollView, Text, TextInput} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

const EditProfileScreen = ({onQuickAction, navigation}) => {
  // Mock State
  const [name, setName] = useState("Samrana");
  const [email, setEmail] = useState("samrana@example.com");
  const [phone, setPhone] = useState("+1 234 567 8900");
  const [gender, setGender] = useState("Female");
  const [dob, setDob] = useState("08/24/1995");

  return (
    <View style={styles.container}>
      {/* Header with Save Button */}
      <Header
        variant="screen"
        title={"Edit Profile"}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => console.log("Saved")}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={RFValue(12)} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields using the custom Input component */}
        <TextInput
          type={1}
          label="FULL NAME"
          value={name}
          onChangeText={setName}
          leftIcon="user"
        />

        <TextInput
          type={1}
          label="EMAIL ADDRESS"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail"
        />

        <TextInput
          type={1}
          label="PHONE NUMBER"
          value={phone}
          onChangeText={setPhone}
          leftIcon="phone"
        />

        {/* Row for Gender and DOB */}
        <View style={styles.row}>
          <TextInput
            type={1}
            label="GENDER"
            value={gender}
            onChangeText={setGender}
            containerStyle={styles.halfInput}
          />

          <TextInput
            type={1}
            label="DATE OF BIRTH"
            value={dob}
            onChangeText={setDob}
            leftIcon="calendar"
            rightIcon="calendar"
            containerStyle={styles.halfInput}
          />
        </View>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          Your profile information is visible to your Circle members.
        </Text>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  saveText: {
    color: "#0ea5e9", // Sky Blue
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  // Image Section
  imageSection: {
    alignItems: "center",
    marginBottom: 24, // Adjusted margin
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0ea5e9", // Sky Blue
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  changePhotoText: {
    color: "#0ea5e9", // Sky Blue
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  // Row Layout
  row: {
    flexDirection: "row",
    gap: 16, // Use gap for spacing between half inputs
  },
  halfInput: {
    flex: 1,
  },
  // Footer
  footerNote: {
    textAlign: "center",
    fontSize: RFValue(10),
    color: "#9ca3af", // Gray-400
    marginTop: 12,
    fontFamily: FontFamily.regular,
  },
});

export default EditProfileScreen;
