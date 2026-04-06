/**
 * AddToListModal
 *
 * Reusable bottom-sheet modal that lets the user pick a list to add a named
 * item to. Used on the Search tab (Suggested For You) and Search Results screen.
 *
 * Props:
 *   isVisible  {boolean}         Whether the sheet is open
 *   itemName   {string}          Display name of the item being added
 *   onClose    {() => void}      Called when the sheet is dismissed
 *   onSelect   {(listId) => void} Called with the chosen list's _id
 */
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import { Text } from "~components/Common";

const AddToListModal = ({ isVisible, itemName = "", onClose, onSelect }) => {
  const { colors } = useTheme();
  const { lists } = useSelector((state) => state.lists);

  const handleSelect = (listId) => {
    onSelect?.(listId);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {/* Drag indicator */}
        <View style={[styles.dragBar, { backgroundColor: colors.border }]} />

        <Text style={[styles.title, { color: colors.textPrimary }]}>Add to List</Text>

        {itemName ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={2}>
            {itemName}
          </Text>
        ) : null}

        <ScrollView
          style={styles.listScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {Array.isArray(lists) && lists.length > 0 ? (
            lists.map((list) => (
              <TouchableOpacity
                key={list._id}
                style={[styles.listRow, { borderColor: colors.border }]}
                onPress={() => handleSelect(list._id)}
                activeOpacity={0.7}>
                <Text style={[styles.listRowText, { color: colors.textPrimary }]}>
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              You don't have any lists yet.
            </Text>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 16,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  hint: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    marginBottom: 14,
  },
  listScroll: {
    maxHeight: 320,
  },
  listRow: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  listRowText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },
  emptyText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default AddToListModal;
