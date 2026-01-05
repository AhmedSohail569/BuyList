const {X} = require("lucide-react-native");
const {useState} = require("react");
const {
  StyleSheet,

  Dimensions,
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
} = require("react-native");
const {RFValue} = require("react-native-responsive-fontsize");
const {Text} = require("~components/Common");
const {FontFamily} = require("~theme/fonts");

const {width} = Dimensions.get("screen");

export const FilterSortModal = ({isVisible, onClose, onApply}) => {
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("100+");

  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Distance",
  ];

  const handleReset = () => {
    setSelectedSort("Relevance");
    setMinPrice("0");
    setMaxPrice("100+");
  };

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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

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
                    style={[
                      styles.chipText,
                      isActive && styles.chipTextActive,
                    ]}>
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

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Aligns modal to bottom (or center if you add padding)
    backgroundColor: "rgba(0,0,0,0.4)",
    // For specific "floating" look in screenshot:
    // alignItems: "center",
    // paddingBottom: Platform.OS === "ios" ? 40 : 20,
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
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
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
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
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
    // height: 44,
  },
  currencyPrefix: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#9ca3af",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    marginTop: 5,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#111827",
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: "#9ca3af",
    fontSize: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
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
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
});
