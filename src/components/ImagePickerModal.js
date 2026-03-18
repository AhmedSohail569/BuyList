/**
 * ImagePickerModal - Reusable modal for camera/gallery selection
 * Provides clean UI for selecting image source
 */
import { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import { Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";

const ImagePickerModal = ({
  isVisible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  title = "Select Photo",
}) => {
  const { colors } = useTheme();
  const [pendingSelection, setPendingSelection] = useState(null); // 'camera' | 'gallery' | null

  // This handles the actual call after modal dismissal
  const handleDismiss = () => {
    if (pendingSelection === "camera") {
      onSelectCamera();
    } else if (pendingSelection === "gallery") {
      onSelectGallery();
    }
    setPendingSelection(null);
  };

  const handleCameraPress = () => {
    setPendingSelection("camera");
    onClose();
    // Android doesn't always trigger onDismiss, so we use a fallback timeout
    if (Platform.OS === "android") {
      setTimeout(() => {
        handleDismiss();
      }, 300);
    }
  };

  const handleGalleryPress = () => {
    setPendingSelection("gallery");
    onClose();
    if (Platform.OS === "android") {
      setTimeout(() => {
        handleDismiss();
      }, 300);
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={Platform.OS === "ios" ? handleDismiss : undefined}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.modalBackground,
                  shadowColor: colors.shadowColor,
                },
              ]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                  <X size={RFValue(18)} color={colors.iconMuted} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {/* Take Photo Option */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={handleCameraPress}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.primaryLight },
                    ]}>
                    <Camera size={RFValue(20)} color={colors.primary} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      Take Photo
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                      Use your camera
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Choose from Gallery Option */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                  onPress={handleGalleryPress}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.successLight },
                    ]}>
                    <ImageIcon size={RFValue(20)} color={colors.success} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      Choose from Gallery
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                      Select existing photo
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={onClose}
                activeOpacity={0.7}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
});

export default ImagePickerModal;
