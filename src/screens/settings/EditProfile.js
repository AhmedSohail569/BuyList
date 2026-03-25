import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Camera, ChevronDown, X, Check } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "react-native-date-picker";
import Header from "~components/Header";
import ImagePickerModal from "~components/ImagePickerModal";
import { ScrollView, Text, TextInput } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import useImagePicker from "~hooks/useImagePicker";
import {
  uploadProfilePicture,
  updateUserInfo,
} from "~redux/actions/profileActions";
import {
  clearUploadPictureError,
  clearUpdateInfoError,
  setProfilePictureOptimistic,
} from "~redux/reducers/profileReducer";
import {
  validateGender,
  validateDateOfBirth,
  removeEmojis,
  validateEmail,
  validatePhone,
} from "~utils/validation";
import useTranslation from "~hooks/useTranslation";

const { width } = Dimensions.get("window");
const MIN_AGE = 13;

// Gender options
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const EditProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Redux state
  const {
    profile,
    uploadingPicture,
    uploadPictureError,
    updatingInfo,
    updateInfoError,
  } = useSelector(state => state.profile);
  // Local form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(null);

  // Field errors
  const [errors, setErrors] = useState({});

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState({});

  // Modal states
  const [isImagePickerVisible, setIsImagePickerVisible] = useState(false);
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Local preview for optimistic update
  const [localImagePreview, setLocalImagePreview] = useState(null);

  // Date picker temp value
  const [tempDate, setTempDate] = useState(new Date());

  // Image picker hook
  const {
    openCamera,
    openGallery,
    isLoading: isPickerLoading,
    error: pickerError,
    clearError: clearPickerError,
  } = useImagePicker({
    width: 600,
    height: 600,
    cropping: true,
    cropperCircleOverlay: true,
    compressImageQuality: 0.7,
  });

  // Calculate max date (13 years ago from today)
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - MIN_AGE);
    return date;
  }, []);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      // Parse date of birth
      let parsedDob = null;
      if (profile.dateOfBirth || profile.dob) {
        const dateStr = profile.dateOfBirth || profile.dob;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          parsedDob = parsed;
        }
      }

      const initialValues = {
        name: profile.username || profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        gender: profile.gender?.toLowerCase() || "",
        dob: parsedDob,
      };

      setName(initialValues.name);
      setEmail(initialValues.email);
      setPhone(initialValues.phone);
      setGender(initialValues.gender);
      setDob(initialValues.dob);
      setOriginalValues(initialValues);

      // Initialize temp date for date picker
      if (parsedDob) {
        setTempDate(parsedDob);
      } else {
        setTempDate(maxDate);
      }
    }
  }, [profile, maxDate]);

  // Handle upload picture error
  useEffect(() => {
    if (uploadPictureError) {
      setLocalImagePreview(null);
      Toast.show({
        type: "error",
        text1: t("editprofile_upload_failed"),
        text2: uploadPictureError,
      });
      dispatch(clearUploadPictureError());
    }
  }, [uploadPictureError, dispatch]);

  // Handle update info error
  useEffect(() => {
    if (updateInfoError) {
      Toast.show({
        type: "error",
        text1: t("editprofile_update_failed"),
        text2: updateInfoError,
      });
      dispatch(clearUpdateInfoError());
    }
  }, [updateInfoError, dispatch]);

  // Handle picker error
  useEffect(() => {
    if (pickerError) {
      Toast.show({
        type: "error",
        text1: t("common_error"),
        text2: pickerError,
      });
      clearPickerError();
    }
  }, [pickerError, clearPickerError]);

  // Clear field error when value changes
  const handleFieldChange = useCallback((field, value, setter) => {
    setter(value);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    const newErrors = {
      email: validateEmail(email),
      phone: validatePhone(phone),
      gender: validateGender(gender),
      dob: validateDateOfBirth(dob, MIN_AGE),
    };

    // Filter out null errors
    const filteredErrors = Object.entries(newErrors).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {});

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  }, [email, phone, gender, dob]);

  // Handle image selection from camera
  const handleCameraSelect = useCallback(async () => {
    const image = await openCamera();
    if (image) {
      setLocalImagePreview(image.path);
      dispatch(setProfilePictureOptimistic(image.path));
      dispatch(uploadProfilePicture(image));
    }
  }, [openCamera, dispatch]);

  // Handle image selection from gallery
  const handleGallerySelect = useCallback(async () => {
    const image = await openGallery();
    if (image) {
      setLocalImagePreview(image.path);
      dispatch(setProfilePictureOptimistic(image.path));
      dispatch(uploadProfilePicture(image));
    }
  }, [openGallery, dispatch]);


  // Handle gender selection
  const handleGenderSelect = useCallback((selectedGender) => {
    handleFieldChange("gender", selectedGender, setGender);
    setIsGenderModalVisible(false);
  }, [handleFieldChange]);

  // Handle date picker open
  const openDatePicker = useCallback(() => {
    setTempDate(dob || maxDate);
    setIsDatePickerVisible(true);
  }, [dob, maxDate]);

  // Handle date picker save
  const handleDateSave = useCallback(() => {
    handleFieldChange("dob", tempDate, setDob);
    setIsDatePickerVisible(false);
  }, [tempDate, handleFieldChange]);

  // Format date for display
  const formatDate = useCallback((date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Get changes from form
  const getChangedFields = useCallback(() => {
    const changes = {};

    if (name !== originalValues.name) {
      changes.username = name;
    }
    if (email !== originalValues.email) {
      changes.email = email;
    }
    if (phone !== originalValues.phone) {
      changes.phone = phone;
    }
    if (gender !== originalValues.gender) {
      changes.gender = gender;
    }

    const originalDobStr = originalValues.dob ? originalValues.dob.toISOString() : "";
    const currentDobStr = dob ? dob.toISOString() : "";
    if (currentDobStr !== originalDobStr) {
      changes.dateOfBirth = dob ? dob.toISOString() : null;
    }

    return changes;
  }, [name, email, phone, gender, dob, originalValues]);

  // Handle save button press
  const handleSave = useCallback(async () => {
    // Validate first
    if (!validateAllFields()) {
      Toast.show({
        type: "error",
        text1: t("editprofile_validation_error"),
        text2: t("editprofile_validation_desc"),
      });
      return;
    }

    const changes = getChangedFields();

    if (Object.keys(changes).length === 0) {
      Toast.show({
        type: "info",
        text1: t("editprofile_no_changes_title"),
        text2: t("editprofile_no_changes_desc"),
      });
      return;
    }

    const result = await dispatch(updateUserInfo(changes));

    if (updateUserInfo.fulfilled.match(result)) {
      Toast.show({
        type: "success",
        text1: t("editprofile_updated_title"),
        text2: t("editprofile_updated_desc"),
      });
      setOriginalValues({
        name,
        email,
        phone,
        gender,
        dob,
      });
    }
  }, [validateAllFields, getChangedFields, dispatch, name, email, phone, gender, dob]);

  // Get display image URI - returns null if no image available
  const getDisplayImage = useCallback(() => {
    if (localImagePreview) {
      return { uri: localImagePreview };
    }
    if (profile?.profilePicture) {
      return { uri: profile.profilePicture };
    }
    return null;
  }, [localImagePreview, profile]);

  // Get user initials for avatar fallback
  const getInitials = useCallback(() => {
    const displayName = name || profile?.username || profile?.name || "";
    if (!displayName) return "?";
    const parts = displayName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  }, [name, profile]);

  const isLoading = uploadingPicture || updatingInfo || isPickerLoading;
  const hasChanges = Object.keys(getChangedFields()).length > 0;

  // Get gender label for display
  const genderLabel = gender
    ? GENDER_OPTIONS.find(g => g.value === gender)?.label || gender
    : "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Save Button */}
      <Header
        variant="screen"
        title={t("editprofile_title")}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !hasChanges}>
            {updatingInfo ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  styles.saveText,
                  {
                    color: hasChanges ? colors.primary : colors.textDisabled,
                  },
                ]}>
                {t("editprofile_save")}
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.avatarContainer}>
              {getDisplayImage() ? (
                <Image source={getDisplayImage()} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primaryLight },
                  ]}>
                  <Text
                    style={[
                      styles.avatarInitials,
                      { color: colors.primary },
                    ]}>
                    {getInitials()}
                  </Text>
                </View>
              )}

              {/* Loading overlay */}
              {uploadingPicture && (
                <View
                  style={[
                    styles.uploadingOverlay,
                    { backgroundColor: "rgba(0,0,0,0.5)" },
                  ]}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}

              {/* Camera button */}
              <TouchableOpacity
                style={[
                  styles.cameraButton,
                  { backgroundColor: colors.primary, borderColor: colors.card },
                ]}
                onPress={() => setIsImagePickerVisible(true)}
                disabled={isLoading}>
                <Camera size={RFValue(12)} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setIsImagePickerVisible(true)}
              disabled={isLoading}>
              <Text
                style={[
                  styles.changePhotoText,
                  { color: isLoading ? colors.textDisabled : colors.primary },
                ]}>
                {t("editprofile_change_photo")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <TextInput
            type={1}
            label={t("editprofile_name")}
            value={name}
            onChangeText={(val) => handleFieldChange("name", removeEmojis(val), setName)}
            leftIcon="user"
            editable={!isLoading}
            maxLength={50}
          />

          <TextInput
            type={1}
            label={t("editprofile_email")}
            value={email}
            onChangeText={(val) => handleFieldChange("email", val, setEmail)}
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
            error={errors.email}
          />

          <TextInput
            type={1}
            label={t("editprofile_phone")}
            value={phone}
            onChangeText={(val) => handleFieldChange("phone", val, setPhone)}
            leftIcon="phone"
            keyboardType="phone-pad"
            editable={false}
            error={errors.phone}
          />

          {/* Row for Gender and DOB */}
          <View style={styles.row}>
            {/* Gender Dropdown */}
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t("editprofile_gender")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  {
                    backgroundColor: isLoading ? colors.inputDisabled : colors.inputBackground,
                    borderColor: errors.gender ? colors.error : colors.inputBorder,
                  },
                ]}
                onPress={() => setIsGenderModalVisible(true)}
                disabled={isLoading}>
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color: isLoading
                        ? colors.textDisabled
                        : genderLabel
                          ? colors.inputText
                          : colors.inputPlaceholder,
                    },
                  ]}>
                  {genderLabel || t("editprofile_select")}
                </Text>
                <ChevronDown size={18} color={isLoading ? colors.iconDisabled : colors.iconMuted} />
              </TouchableOpacity>
              {errors.gender && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.gender}
                </Text>
              )}
            </View>

            {/* Date of Birth Picker */}
            <View style={styles.halfInput}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t("editprofile_dob")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  {
                    backgroundColor: isLoading ? colors.inputDisabled : colors.inputBackground,
                    borderColor: errors.dob ? colors.error : colors.inputBorder,
                  },
                ]}
                onPress={openDatePicker}
                disabled={isLoading}>
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color: isLoading
                        ? colors.textDisabled
                        : dob
                          ? colors.inputText
                          : colors.inputPlaceholder,
                    },
                  ]}>
                  {dob ? formatDate(dob) : t("editprofile_select")}
                </Text>
                <ChevronDown size={18} color={isLoading ? colors.iconDisabled : colors.iconMuted} />
              </TouchableOpacity>
              {errors.dob && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.dob}
                </Text>
              )}
            </View>
          </View>

          {/* Footer Note */}
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            {t("editprofile_footer")}
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        isVisible={isImagePickerVisible}
        onClose={() => setIsImagePickerVisible(false)}
        onSelectCamera={handleCameraSelect}
        onSelectGallery={handleGallerySelect}
        title="Change Profile Photo"
      />

      {/* Gender Selection Modal */}
      <Modal
        transparent
        visible={isGenderModalVisible}
        animationType="fade"
        onRequestClose={() => setIsGenderModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsGenderModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.genderModalContainer,
                  { backgroundColor: colors.modalBackground },
                ]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {t("editprofile_select_gender")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsGenderModalVisible(false)}
                    hitSlop={10}>
                    <X size={RFValue(18)} color={colors.iconMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.genderOptions}>
                  {GENDER_OPTIONS.map((option) => {
                    const isSelected = gender === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.genderOption,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryLight
                              : colors.backgroundSecondary,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() => handleGenderSelect(option.value)}
                        activeOpacity={0.7}>
                        <Text
                          style={[
                            styles.genderOptionText,
                            {
                              color: isSelected
                                ? colors.primary
                                : colors.textPrimary,
                            },
                          ]}>
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Check size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        transparent
        visible={isDatePickerVisible}
        animationType="slide"
        onRequestClose={() => setIsDatePickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setIsDatePickerVisible(false)}>
          <View style={styles.dateModalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dateModalContainer,
                  { backgroundColor: colors.modalBackground },
                ]}>
                <View style={styles.dateModalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Date of Birth
                  </Text>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleDateSave}>
                    <Text style={[styles.doneText, { color: colors.primary }]}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.ageNote, { color: colors.textMuted }]}>
                  You must be at least {MIN_AGE} years old
                </Text>

                <View style={styles.datePickerWrapper}>
                  {Platform.OS === "ios" ? (
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="spinner"
                      maximumDate={maxDate}
                      onChange={(event, date) => date && setTempDate(date)}
                      style={{ width: "100%" }}
                      themeVariant={isDark ? "dark" : "light"}
                      textColor={colors.textPrimary}
                    />
                  ) : (
                    <DatePicker
                      modal={false}
                      date={tempDate}
                      mode="date"
                      maximumDate={maxDate}
                      onDateChange={setTempDate}
                      style={{ alignSelf: "center", width: width - 60 }}
                      dividerColor={colors.border}
                      theme={isDark ? "dark" : "light"}
                      androidVariant="iosClone"
                    />
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  saveText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  // Image Section
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
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
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: RFValue(28),
    fontFamily: FontFamily.bold,
    lineHeight: RFValue(50),
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  changePhotoText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  // Row Layout
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 18,
  },
  // Label style (matches TextInput component)
  label: {
    fontFamily: FontFamily.medium,
    fontSize: RFValue(11),
    fontWeight: "600",
    marginBottom: 6,
  },
  dropdownButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: RFValue(12),
    flex: 1,
  },
  errorText: {
    marginTop: 6,
    fontSize: RFValue(10),
  },
  // Footer
  footerNote: {
    textAlign: "center",
    fontSize: RFValue(10),
    marginTop: 12,
    fontFamily: FontFamily.regular,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  genderModalContainer: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
  genderOptions: {
    gap: 12,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  genderOptionText: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.medium,
  },
  // Date Modal
  dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dateModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateModalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
    height: 40,
  },
  doneButton: {
    position: "absolute",
    right: 0,
    height: "100%",
    justifyContent: "center",
  },
  doneText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  ageNote: {
    textAlign: "center",
    fontSize: RFValue(10),
    marginBottom: 10,
  },
  datePickerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
