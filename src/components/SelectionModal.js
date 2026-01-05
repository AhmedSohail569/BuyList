import React, {useState, useEffect} from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import {X} from "lucide-react-native";
import {Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

const {width} = Dimensions.get("window");

const SelectionModal = ({
  isVisible,
  onClose,
  onSave,
  title,
  options = [],
  initialValue,
}) => {
  const [selected, setSelected] = useState(initialValue);

  // Reset selection when modal opens
  useEffect(() => {
    if (isVisible) {
      setSelected(initialValue);
    }
  }, [isVisible, initialValue]);

  const handleSave = () => {
    onSave(selected);
    onClose();
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

              {/* Options List */}
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
                      {/* Radio Circle */}
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

                      {/* Label */}
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}>
                  <Text style={styles.saveText}>Save</Text>
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
    padding: 20,
    // Elevation/Shadow
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
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
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
    borderColor: "#f3f4f6", // Light gray border unselected
    backgroundColor: "#ffffff",
  },
  optionItemSelected: {
    borderColor: "#0ea5e9", // Blue border selected
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9ca3af", // Gray border unselected
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: "#0ea5e9", // Blue border selected
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0ea5e9", // Blue fill
  },
  optionLabel: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#1f2937",
  },

  // Footer
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#f3f4f6", // Light gray bg
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
    backgroundColor: "#1E9DF1", // Blue bg
    borderRadius: 12,
    alignItems: "center",
    // Button shadow for pop
    shadowColor: "#1E9DF1",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});

export default SelectionModal;
