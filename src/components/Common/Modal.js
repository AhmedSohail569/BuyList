import {useState, useEffect} from "react";
import {
  StyleSheet,
  Dimensions,
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Platform,
} from "react-native";
import {X, Plus, ChevronDown, Users} from "lucide-react-native";
import {RFValue} from "react-native-responsive-fontsize";
import {Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

const {width, height} = Dimensions.get("window");

export const BottomModal = ({
  isVisible,
  onClose,
  onApply,
  type = "filter", // 'filter' | 'createList'
  loading = false,
}) => {
  const {colors, isDark} = useTheme();
  // --- STATE: Filter Mode ---
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("100+");

  // --- STATE: Create List Mode ---
  const [listName, setListName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Groceries");
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [isShared, setIsShared] = useState(true);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CONSTANTS ---
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Distance",
  ];

  const categoryOptions = [
    "Groceries",
    "Home",
    "Work",
    "Gifts",
    "Health",
    "Other",
  ];

  const priorityOptions = [
    {label: "Low", value: "low"},
    {label: "Medium", value: "medium"},
    {label: "High", value: "high"},
  ];

  // --- HANDLERS ---
  const handleResetFilter = () => {
    setSelectedSort("Relevance");
    setMinPrice("0");
    setMaxPrice("100+");
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible && type === "createList") {
      setListName("");
      setSelectedCategory("Groceries");
      setNewItem("");
      setItems([]);
      setPriority("medium");
      setIsShared(true);
      setShowPriorityDropdown(false);
    }
  }, [isVisible, type]);

  const handleAddItem = () => {
    const trimmedItem = newItem.trim();
    if (trimmedItem && !items.includes(trimmedItem)) {
      setItems([...items, trimmedItem]);
      setNewItem("");
    }
  };

  const handleRemoveItem = itemToRemove => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  const handleCreateList = async () => {
    // Validate required fields
    if (!listName.trim()) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (isSubmitting || loading) return;
    setIsSubmitting(true);

    try {
      // Await parent handler so we can prevent double submit.
      await Promise.resolve(
        onApply({
          name: listName.trim(),
          category: selectedCategory,
          items: items,
          priority: priority,
          shareWithCircle: isShared,
        }),
      );
      // Parent closes modal on success; this keeps behavior consistent.
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER CONTENT ---
  const renderFilterContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>Filters & Sort</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color={colors.iconMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sort Section */}
        <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>SORT BY</Text>
        <View style={styles.chipsContainer}>
          {sortOptions.map(option => {
            const isActive = selectedSort === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? (isDark ? colors.textPrimary : "#000000") : colors.modalBackground,
                    borderColor: isActive ? (isDark ? colors.textPrimary : "#000000") : colors.border,
                  },
                ]}
                onPress={() => setSelectedSort(option)}>
                <Text
                  style={[
                    styles.chipText,
                    {color: isActive ? (isDark ? colors.background : "#ffffff") : colors.textSecondary},
                  ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Range Section */}
        <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>PRICE RANGE</Text>
        <View style={styles.priceRow}>
          <View style={[styles.priceInputContainer, {backgroundColor: colors.surfaceSecondary, borderColor: colors.border}]}>
            <Text style={[styles.currencyPrefix, {color: colors.textMuted}]}>$</Text>
            <TextInput
              style={[styles.priceInput, {color: colors.textPrimary}]}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <Text style={[styles.priceSeparator, {color: colors.textMuted}]}>–</Text>
          <View style={[styles.priceInputContainer, {backgroundColor: colors.surfaceSecondary, borderColor: colors.border}]}>
            <Text style={[styles.currencyPrefix, {color: colors.textMuted}]}>$</Text>
            <TextInput
              style={[styles.priceInput, {color: colors.textPrimary}]}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.resetButton, {backgroundColor: colors.surfaceSecondary}]}
          onPress={handleResetFilter}>
          <Text style={[styles.resetButtonText, {color: colors.textPrimary}]}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyButton, {backgroundColor: colors.primary}]}
          onPress={() => {
            onApply({sort: selectedSort, minPrice, maxPrice});
            onClose();
          }}>
          <Text style={styles.applyButtonText}>Show Results</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderCreateListContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>New List</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color={colors.iconMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* List Name */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>LIST NAME</Text>
        <View style={[styles.inputContainer, {backgroundColor: colors.surfaceSecondary, borderColor: colors.border}]}>
          <TextInput
            style={[styles.textInput, {color: colors.textPrimary}]}
            placeholder="e.g., Weekly Groceries"
            placeholderTextColor={colors.inputPlaceholder}
            value={listName}
            onChangeText={setListName}
          />
        </View>

        {/* Category */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>CATEGORY</Text>
        <View style={styles.chipsContainer}>
          {categoryOptions.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? (isDark ? "rgba(14, 165, 233, 0.2)" : "#eff6ff") : colors.modalBackground,
                    borderColor: isActive ? (isDark ? "rgba(14, 165, 233, 0.3)" : "#eff6ff") : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    {color: isActive ? colors.primary : colors.textSecondary},
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Items */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>ADD ITEMS</Text>
        <View style={[styles.inputContainer, {backgroundColor: colors.surfaceSecondary, borderColor: colors.border}]}>
          <TextInput
            style={[styles.textInput, {color: colors.textPrimary}]}
            placeholder="Add an item..."
            placeholderTextColor={colors.inputPlaceholder}
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.plusIconBadge,
              {backgroundColor: newItem.trim() ? colors.primary : colors.border},
            ]}
            onPress={handleAddItem}
            disabled={!newItem.trim()}>
            <Plus size={16} color={newItem.trim() ? "#ffffff" : colors.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* Display Added Items */}
        {items.length > 0 && (
          <View style={styles.itemsContainer}>
            {items.map((item, index) => (
              <View key={index} style={[styles.itemChip, {backgroundColor: isDark ? "rgba(14, 165, 233, 0.2)" : "#eff6ff"}]}>
                <Text style={[styles.itemChipText, {color: colors.primary}]}>{item}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item)}
                  hitSlop={8}>
                  <X size={14} color={colors.iconMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Set Priority */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>SET PRIORITY</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.dropdownInput, {backgroundColor: colors.surfaceSecondary, borderColor: colors.border}]}
            onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}>
            <Text style={[styles.inputText, {color: colors.textSecondary}]}>
              {priorityOptions.find(opt => opt.value === priority)?.label ||
                "Medium"}
            </Text>
            <ChevronDown
              size={20}
              color={colors.iconMuted}
              style={{
                transform: [{rotate: showPriorityDropdown ? "180deg" : "0deg"}],
              }}
            />
          </TouchableOpacity>

          {showPriorityDropdown && (
            <>
              <TouchableWithoutFeedback
                onPress={() => setShowPriorityDropdown(false)}>
                <View style={styles.dropdownBackdrop} />
              </TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, {backgroundColor: colors.modalBackground, borderColor: colors.border}]}>
                {priorityOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      {borderBottomColor: colors.divider},
                      priority === option.value && {backgroundColor: isDark ? "rgba(14, 165, 233, 0.15)" : "#eff6ff"},
                    ]}
                    onPress={() => {
                      setPriority(option.value);
                      setShowPriorityDropdown(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        {color: priority === option.value ? colors.primary : colors.textMuted},
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Share Toggle */}
        <View style={[styles.divider, {backgroundColor: colors.divider}]} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={[styles.iconCircle, {backgroundColor: isDark ? "rgba(14, 165, 233, 0.2)" : "#eff6ff"}]}>
              <Users size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.toggleTitle, {color: colors.textPrimary}]}>Share with Circle</Text>
              <Text style={[styles.toggleSubtitle, {color: colors.textMuted}]}>Family Home</Text>
            </View>
          </View>
          <Switch
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={"#ffffff"}
            ios_backgroundColor={colors.border}
            onValueChange={setIsShared}
            value={isShared}
            style={styles.switch}
          />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.modalFooterSingle}>
        <TouchableOpacity
          style={[
            styles.createButton,
            {backgroundColor: colors.primary},
            (loading || isSubmitting) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateList}
          disabled={loading || isSubmitting}>
          <Text style={styles.createButtonText}>
            {loading || isSubmitting ? "Creating..." : "Create List"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.modalOverlay, {backgroundColor: colors.modalOverlay}]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContent, {backgroundColor: colors.modalBackground, shadowColor: colors.shadowColor}]}>
          {type === "createList"
            ? renderCreateListContent()
            : renderFilterContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // --- Modal Structure ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: width,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: height * 0.85,
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

  // --- Filter Mode Styles ---
  sectionLabel: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  chipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  chipText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#374151",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#9ca3af",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#111827",
    paddingVertical: 0,
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: "#9ca3af",
    fontSize: 20,
  },

  // --- Create List Mode Styles ---
  inputLabel: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#111827",
    paddingRight: 40, // Space for button inside input
  },
  plusIconBadge: {
    position: "absolute",
    right: 8,
    backgroundColor: "#e5e7eb", // Light grey badge
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  plusIconBadgeActive: {
    backgroundColor: "#0ea5e9", // Blue when active
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  itemChipText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
  },
  dropdownContainer: {
    marginBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  dropdownBackdrop: {
    position: "absolute",
    top: -200,
    left: -20,
    right: -20,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: "absolute",
    bottom: 52, // Position above the input field (input height 50 + 2px margin)
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4}, // Shadow above
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    marginBottom: 4,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownOptionActive: {
    backgroundColor: "#eff6ff",
  },
  dropdownOptionText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
  },
  dropdownOptionTextActive: {
    color: "#0ea5e9",
    fontFamily: FontFamily.medium,
  },
  categoryChip: {
    flexGrow: 1,
    flexBasis: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  categoryChipActive: {
    backgroundColor: "#eff6ff", // Light Blue
    borderColor: "#eff6ff",
  },
  categoryChipText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    color: "#4b5563",
  },
  categoryChipTextActive: {
    color: "#0ea5e9", // Blue Text
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },
  inputText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  toggleSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
  },

  // --- Footers ---
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalFooterSingle: {
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#1f2937",
  },
  applyButton: {
    flex: 2,
    backgroundColor: "#0ea5e9", // Blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
  createButton: {
    width: "100%",
    backgroundColor: "#0ea5e9", // Blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});
