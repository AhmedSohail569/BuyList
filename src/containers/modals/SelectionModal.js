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
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Enter name"
              autoFocus
            />
          </View>
        );

      case "confirmation":
        return (
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationTitle}>Are You Sure?</Text>
            <Text style={styles.confirmationDesc}>{description}</Text>
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
                    isSelected && styles.optionItemSelected,
                  ]}
                  onPress={() => setSelected(option.value)}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={10}>
                  <X size={RFValue(18)} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Dynamic Content */}
              {renderContent()}

              {/* Footer Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    danger && styles.dangerButton, // Red button for Delete/Leave
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
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
    color: "#111827",
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
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  optionItemSelected: {
    borderColor: "#1E9DF1",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9ca3af",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: "#1E9DF1",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1E9DF1",
  },
  optionLabel: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#1f2937",
  },

  // --- Input Styles ---
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#0ea5e9", // Blue border like screenshot
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#111827",
  },

  // --- Confirmation Styles ---
  confirmationContainer: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 8,
  },
  confirmationDesc: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
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
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#1E9DF1",
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#EF4444", // Red for danger actions
  },
  saveText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});

export default SelectionModal;
