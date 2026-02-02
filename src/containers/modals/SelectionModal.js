import React, {useState, useEffect} from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Dimensions,
} from "react-native";
import {X, Trash2, LogOut} from "lucide-react-native";
import {Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

const {width} = Dimensions.get("window");

/**
 * Enhanced Selection Modal
 * Supports: 'selection' | 'input' | 'confirmation'
 */
const SelectionModal = ({
  isVisible,
  onClose,
  onSave,
  title,
  type = "selection", // 'selection' | 'input' | 'confirmation'
  options = [],
  initialValue,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  description = "", // For confirmation modal text
  danger = false, // For red buttons (Delete/Leave)
}) => {
  const {colors} = useTheme();
  const [selected, setSelected] = useState(initialValue);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (isVisible) {
      if (type === "selection") setSelected(initialValue);
      if (type === "input") setInputText(initialValue || "");
    }
  }, [isVisible, initialValue, type]);

  const handleSave = () => {
    if (type === "input") {
      onSave(inputText);
    } else if (type === "selection") {
      onSave(selected);
    } else {
      onSave(); // Confirmation action
    }
    onClose();
  };

  const renderContent = () => {
    switch (type) {
      case "input":
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, {borderColor: colors.primary, color: colors.textPrimary, backgroundColor: colors.inputBackground}]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Enter name"
              placeholderTextColor={colors.inputPlaceholder}
              autoFocus
            />
          </View>
        );

      case "confirmation":
        return (
          <View style={styles.confirmationContainer}>
            <Text style={[styles.confirmationTitle, {color: colors.textPrimary}]}>Are You Sure?</Text>
            <Text style={[styles.confirmationDesc, {color: colors.textSecondary}]}>{description}</Text>
          </View>
        );

      case "selection":
      default:
        return (
          <View style={styles.optionsContainer}>
            {options.map(option => {
              const isSelected = selected === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    {backgroundColor: colors.backgroundSecondary, borderColor: colors.border},
                    isSelected && [styles.optionItemSelected, {borderColor: colors.primary}],
                  ]}
                  onPress={() => setSelected(option.value)}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.radioOuter,
                      {borderColor: colors.iconMuted},
                      isSelected && [styles.radioOuterSelected, {borderColor: colors.primary}],
                    ]}>
                    {isSelected && <View style={[styles.radioInner, {backgroundColor: colors.primary}]} />}
                  </View>
                  <Text style={[styles.optionLabel, {color: colors.textPrimary}]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, {backgroundColor: colors.modalOverlay}]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, {backgroundColor: colors.modalBackground, shadowColor: colors.shadowColor}]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                  <X size={RFValue(18)} color={colors.iconMuted} />
                </TouchableOpacity>
              </View>

              {/* Dynamic Content */}
              {renderContent()}

              {/* Footer Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity style={[styles.cancelButton, {backgroundColor: colors.backgroundSecondary}]} onPress={onClose}>
                  <Text style={[styles.cancelText, {color: colors.textSecondary}]}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {backgroundColor: colors.primary},
                    danger && [styles.dangerButton, {backgroundColor: colors.error}],
                  ]}
                  onPress={handleSave}>
                  <Text style={styles.saveText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowOffset: {width: 0, height: 10},
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

  // --- Selection Styles ---
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionItemSelected: {},
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioOuterSelected: {},
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },

  // --- Input Styles ---
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },

  // --- Confirmation Styles ---
  confirmationContainer: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  confirmationDesc: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },

  // --- Footer ---
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButton: {},
  saveText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});

export default SelectionModal;
