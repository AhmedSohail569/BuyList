import React, {useState} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Plus,
  Check,
  MoreHorizontal,
} from "lucide-react-native";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

// --- Mock Data ---
const INITIAL_ITEMS = [
  {
    id: 1,
    name: "Almond Milk",
    addedBy: "Samrana",
    category: "Dairy",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&q=80",
    status: "pending", // pending | purchased
  },
  {
    id: 2,
    name: "Organic Bananas",
    addedBy: "Alex",
    category: "Produce",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=50&q=80",
    status: "pending",
  },
  {
    id: 3,
    name: "Avocados",
    addedBy: "Jordan",
    category: "Produce",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&q=80",
    status: "pending",
  },
  {
    id: 4,
    name: "Sourdough Bread",
    addedBy: "Samrana",
    category: "Bakery",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&q=80",
    status: "purchased",
  },
  {
    id: 5,
    name: "Eggs (Dozen)",
    addedBy: "Alex",
    category: "Dairy",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=50&q=80",
    status: "purchased",
  },
];

const ListDetailsScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState("All Items"); // 'All Items' | 'To Buy'
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeItemMenuId, setActiveItemMenuId] = useState(null); // ID of item with open menu
  const [newItemText, setNewItemText] = useState("");

  // Statistics
  const totalItems = items.length;
  const purchasedItems = items.filter(i => i.status === "purchased").length;
  const progressPercent =
    totalItems === 0 ? 0 : (purchasedItems / totalItems) * 100;

  // Toggle Item Status
  const toggleItemStatus = id => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: item.status === "pending" ? "purchased" : "pending",
            }
          : item,
      ),
    );
  };

  // Add Item
  const handleAddItem = () => {
    if (newItemText.trim() === "") return;
    const newItem = {
      id: Date.now(),
      name: newItemText,
      addedBy: "Me",
      category: "General",
      avatar: "https://i.pravatar.cc/150?img=12",
      status: "pending",
    };
    setItems([newItem, ...items]);
    setNewItemText("");
  };

  // Rendering Logic
  const pendingItems = items.filter(i => i.status === "pending");
  const doneItems = items.filter(i => i.status === "purchased");

  const renderItem = item => (
    <View key={item.id} style={styles.itemRow}>
      {/* Checkbox / Radio */}
      <TouchableOpacity
        style={styles.checkCircleContainer}
        onPress={() => toggleItemStatus(item.id)}>
        {item.status === "purchased" ? (
          <View style={styles.checkedCircle}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        ) : (
          <View style={styles.uncheckedCircle} />
        )}
      </TouchableOpacity>

      {/* Text Content */}
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            item.status === "purchased" && styles.itemNameStrike,
          ]}>
          {item.name}
        </Text>
        <View style={styles.itemMetaRow}>
          <Image source={{uri: item.avatar}} style={styles.itemAvatar} />
          <Text style={styles.itemMetaText}>
            {item.status === "purchased" ? "Purchased by" : "Added by"}{" "}
            {item.addedBy} • {item.category}
          </Text>
        </View>
      </View>

      {/* Kebab Menu Button */}
      <TouchableOpacity
        onPress={() =>
          setActiveItemMenuId(activeItemMenuId === item.id ? null : item.id)
        }
        hitSlop={10}>
        <MoreHorizontal size={20} color="#d1d5db" />
      </TouchableOpacity>

      {/* Item Dropdown Menu */}
      {activeItemMenuId === item.id && (
        <View style={styles.itemMenu}>
          <TouchableOpacity
            style={styles.itemMenuOptionActive}
            onPress={() => {
              toggleItemStatus(item.id);
              setActiveItemMenuId(null);
            }}>
            <Text style={styles.itemMenuTextBlue}>
              {item.status === "purchased" ? "Mark Pending" : "Purchased"}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.itemMenuOption}
            onPress={() => setActiveItemMenuId(null)}>
            <Text style={styles.itemMenuText}>Pending</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.itemMenuOption}
            onPress={() => setActiveItemMenuId(null)}>
            <Text style={styles.itemMenuTextRed}>Unavailable</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setShowHeaderMenu(false);
        setActiveItemMenuId(null);
      }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Groceries</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Share2 size={22} color="#1f2937" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowHeaderMenu(!showHeaderMenu)}>
              <MoreVertical size={22} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* Header Dropdown Menu */}
          {showHeaderMenu && (
            <View style={styles.headerMenu}>
              <TouchableOpacity style={styles.headerMenuOptionActive}>
                <Text style={styles.itemMenuTextBlue}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.headerMenuOption}>
                <Text style={styles.itemMenuText}>View</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.headerMenuOption}>
                <Text style={styles.itemMenuTextRed}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                {purchasedItems}/{totalItems} purchased
              </Text>
              <Text style={styles.progressPercentText}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, {width: `${progressPercent}%`}]} />
            </View>
          </View>

          {/* Add Item Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add an item..."
              placeholderTextColor="#9ca3af"
              value={newItemText}
              onChangeText={setNewItemText}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Plus size={20} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "All Items" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("All Items")}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "All Items" && styles.activeTabText,
                ]}>
                All Items
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "To Buy" && styles.activeTab]}
              onPress={() => setActiveTab("To Buy")}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "To Buy" && styles.activeTabText,
                ]}>
                To Buy ({pendingItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Item List */}
          <View style={styles.listContainer}>
            {/* Pending Items (Shown in both tabs) */}
            {pendingItems.map(renderItem)}

            {/* Purchased Items (Only in All Items) */}
            {activeTab === "All Items" && doneItems.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PURCHASED</Text>
                </View>
                {doneItems.map(renderItem)}
              </>
            )}

            {/* Empty State for To Buy */}
            {activeTab === "To Buy" && pendingItems.length === 0 && (
              <Text style={styles.emptyText}>
                All caught up! Nothing to buy.
              </Text>
            )}
          </View>

          <View style={{height: 100}} />
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? 40 : 60,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 20, // Ensure menu sits on top
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 0,
  },
  headerMenu: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 140,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 4,
  },
  headerMenuOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerMenuOptionActive: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f0f9ff", // Light blue highlight
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  // Progress Bar
  progressContainer: {
    marginTop: 4,
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: RFValue(11),
    color: "#4b5563",
    fontFamily: FontFamily.medium,
  },
  progressPercentText: {
    fontSize: RFValue(11),
    color: "#0ea5e9",
    fontFamily: FontFamily.bold,
  },
  track: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
  },
  fill: {
    height: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 3,
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#111827",
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: "#e5e7eb", // Light gray like screenshot
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 20,
    gap: 24,
  },
  tab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#111827", // Black indicator
  },
  tabText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#6b7280",
  },
  activeTabText: {
    color: "#111827",
    fontFamily: FontFamily.bold,
  },

  // Lists
  listContainer: {
    gap: 20,
  },
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#f9fafb", // Slight bg for purchased header
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
    fontFamily: FontFamily.regular,
  },

  // Item Row
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 1, // Default zIndex
  },
  checkCircleContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22c55e", // Green
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#1f2937",
    marginBottom: 4,
  },
  itemNameStrike: {
    textDecorationLine: "line-through",
    color: "#4b5563",
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  itemMetaText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },

  // Item Dropdown Menu
  itemMenu: {
    position: "absolute",
    right: 0,
    top: 25, // Just below kebab
    width: 130,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100, // Important to sit on top of next row
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  itemMenuOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemMenuOptionActive: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff", // Very light blue
  },
  itemMenuText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#374151",
  },
  itemMenuTextBlue: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
  },
  itemMenuTextRed: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
});

export default ListDetailsScreen;
