import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import { Text } from "~components/Common";

const ItemPriorityModal = ({ isVisible, currentPriority = "medium", onClose, onSave }) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(currentPriority);

  useEffect(() => {
    if (isVisible) {
      setSelected(currentPriority);
    }
  }, [isVisible, currentPriority]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Set Item Priority
          </Text>

          {["low", "medium", "high"].map(p => {
            const isSelected = selected === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalOption,
                  { borderColor: isSelected ? colors.primary : colors.border },
                ]}
                onPress={() => setSelected(p)}>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: isSelected ? colors.primary : colors.border },
                  ]}>
                  {isSelected && (
                    <View
                      style={[styles.radioDot, { backgroundColor: colors.primary }]}
                    />
                  )}
                </View>
                <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: colors.backgroundSecondary },
              ]}
              onPress={onClose}>
              <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => onSave(selected)}>
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: RFValue(15),
    fontFamily: FontFamily.bold,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalOptionText: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.medium,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
});

export default ItemPriorityModal;
