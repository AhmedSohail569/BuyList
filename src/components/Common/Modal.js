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
import {Text} from "~components/Common"; // Assuming your path
import {FontFamily} from "~theme/fonts"; // Assuming your path

const {width, height} = Dimensions.get("window");

export const BottomModal = ({
  isVisible,
  onClose,
  onApply,
  type = "filter", // 'filter' | 'createList'
}) => {
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

    // Call onApply and let parent handle closing on success
    onApply({
      name: listName.trim(),
      category: selectedCategory,
      items: items,
      priority: priority,
      shareWithCircle: isShared,
    });
    // Don't close here - let parent handle it after successful dispatch
  };

  // --- RENDER CONTENT ---
  const renderFilterContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Filters & Sort</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sort Section */}
        <Text style={styles.sectionLabel}>SORT BY</Text>
        <View style={styles.chipsContainer}>
          {sortOptions.map(option => {
            const isActive = selectedSort === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedSort(option)}>
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Range Section */}
        <Text style={styles.sectionLabel}>PRICE RANGE</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.priceSeparator}>–</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetFilter}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
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
        <Text style={styles.modalTitle}>New List</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* List Name */}
        <Text style={styles.inputLabel}>LIST NAME</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Weekly Groceries"
            placeholderTextColor="#9ca3af"
            value={listName}
            onChangeText={setListName}
          />
        </View>

        {/* Category */}
        <Text style={styles.inputLabel}>CATEGORY</Text>
        <View style={styles.chipsContainer}>
          {categoryOptions.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Items */}
        <Text style={styles.inputLabel}>ADD ITEMS</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Add an item..."
            placeholderTextColor="#9ca3af"
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.plusIconBadge,
              newItem.trim() && styles.plusIconBadgeActive,
            ]}
            onPress={handleAddItem}
            disabled={!newItem.trim()}>
            <Plus size={16} color={newItem.trim() ? "#ffffff" : "#9ca3af"} />
          </TouchableOpacity>
        </View>

        {/* Display Added Items */}
        {items.length > 0 && (
          <View style={styles.itemsContainer}>
            {items.map((item, index) => (
              <View key={index} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item)}
                  hitSlop={8}>
                  <X size={14} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Set Priority */}
        <Text style={styles.inputLabel}>SET PRIORITY</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownInput}
            onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}>
            <Text style={styles.inputText}>
              {priorityOptions.find(opt => opt.value === priority)?.label ||
                "Medium"}
            </Text>
            <ChevronDown
              size={20}
              color="#9ca3af"
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
              <View style={styles.dropdownMenu}>
                {priorityOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      priority === option.value && styles.dropdownOptionActive,
                    ]}
                    onPress={() => {
                      setPriority(option.value);
                      setShowPriorityDropdown(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        priority === option.value &&
                          styles.dropdownOptionTextActive,
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
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={styles.iconCircle}>
              <Users size={20} color="#0ea5e9" />
            </View>
            <View>
              <Text style={styles.toggleTitle}>Share with Circle</Text>
              <Text style={styles.toggleSubtitle}>Family Home</Text>
            </View>
          </View>
          <Switch
            trackColor={{false: "#E5E7EB", true: "#0ea5e9"}}
            thumbColor={"#ffffff"}
            ios_backgroundColor="#E5E7EB"
            onValueChange={setIsShared}
            value={isShared}
            style={styles.switch}
          />
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.modalFooterSingle}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateList}>
          <Text style={styles.createButtonText}>Create List</Text>
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
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
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
    backgroundColor: "rgba(0,0,0,0.4)",
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
    backgroundColor: "#ffffff",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: height * 0.85, // Prevent content form taking full screen
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
    color: "#111827",
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
  createButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});
