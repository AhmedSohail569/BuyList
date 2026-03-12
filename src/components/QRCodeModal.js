import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";
import { RFValue } from "react-native-responsive-fontsize";

const { width } = Dimensions.get("window");

const QRCodeModal = ({ visible, onClose, qrCodeUrl, loading, circleName }) => {
    console.log('qr', qrCodeUrl)
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.card, shadowColor: colors.shadowColor },
          ]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary },
              ]}>
              Circle Invite QR
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Scan this code to join {circleName ? `"${circleName}"` : "the circle"}
            </Text>

            <View
              style={[
                styles.qrContainer,
                {
                  backgroundColor: isDark ? "#FFFFFF" : colors.background,
                  borderColor: colors.border,
                },
              ]}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : qrCodeUrl ? (
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: colors.error, fontFamily: FontFamily.medium }}>
                  Failed to load QR Code
                </Text>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: width - 40,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: RFValue(18),
    fontFamily: FontFamily.bold,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  subtitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.medium,
    textAlign: "center",
    marginBottom: 24,
  },
  qrContainer: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  doneButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
});

export default QRCodeModal;
