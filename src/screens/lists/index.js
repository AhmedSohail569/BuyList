import React, {useState, useEffect} from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import {
  Plus,
  Search,
  MoreHorizontal,
  Sparkles,
  Users,
  Check,
  ListFilter,
} from "lucide-react-native";
import {Modal, ScrollView, Text} from "~components/Common";
import Header from "~components/Header";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

// --- Mock Data ---
const LISTS_DATA = [
  {
    id: 1,
    title: "Weekly Groceries",
    category: "Groceries",
    updated: "Updated 2h ago",
    totalItems: 24,
    completedItems: 18,
    color: "#0ea5e9", // Blue
    isShared: true,
    isCompleted: false,
    members: [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    id: 2,
    title: "Apartment Essentials",
    category: "Home",
    updated: "Updated 1d ago",
    totalItems: 8,
    completedItems: 2,
    color: "#0ea5e9", // Blue
    isShared: true,
    isCompleted: false,
    showMenu: false,
    members: [
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    id: 3,
    title: "Personal To-Do",
    category: "Personal",
    updated: "Updated 3h ago",
    totalItems: 5,
    completedItems: 0,
    color: "#22c55e", // Green
    isShared: false,
    isCompleted: false,
    members: [],
  },
  {
    id: 4,
    title: "Weekend BBQ",
    category: "Food",
    updated: "Updated 5d ago",
    totalItems: 15,
    completedItems: 15,
    color: "#ef4444", // Red
    isShared: true,
    isCompleted: true,
    members: [
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    id: 5,
    title: "Gift Ideas",
    category: "Gifts",
    updated: "Updated 1w ago",
    totalItems: 3,
    completedItems: 1,
    color: "#a855f7", // Purple
    isShared: false,
    isCompleted: false,
    members: [],
  },
];

// --- Sub Components ---

const FilterTab = ({label, isActive, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterTab, isActive && styles.filterTabActive]}>
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProgressBar = ({completed, total, color}) => {
  const percentage = total === 0 ? 0 : (completed / total) * 100;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressStats}>
          {completed}/{total} items
        </Text>
        <Text style={[styles.progressPercentage, {color: color}]}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${percentage}%`, backgroundColor: color},
          ]}
        />
      </View>
    </View>
  );
};

const AvatarStack = ({images}) => {
  if (!images || images.length === 0) return null;
  return (
    <View style={styles.avatarStack}>
      {images.map((uri, index) => (
        <Image
          key={index}
          source={{uri}}
          style={[styles.avatar, {marginLeft: index === 0 ? 0 : -10}]}
        />
      ))}
    </View>
  );
};

const ListsTab = ({onQuickAction, navigation, route}) => {
  const [activeTab, setActiveTab] = useState("All Lists");
  // Optional: Toggle menu state for demo purposes (e.g. card id 2)
  const [activeMenuId, setActiveMenuId] = useState(2);

  const [isCreateListVisible, setCreateListVisible] = useState(false);

  // Handle navigation params to switch tabs automatically
  useEffect(() => {
    if (route?.params?.filter) {
      const filterParam = route.params.filter.toLowerCase();
      if (filterParam === "shared") {
        setActiveTab("Shared Lists");
      } else if (filterParam === "personal") {
        setActiveTab("Personal Lists");
      } else {
        setActiveTab("All Lists");
      }
    }
  }, [route?.params]);

  // Filter Logic
  const filteredData = LISTS_DATA.filter(item => {
    if (activeTab === "Personal Lists") {
      return !item.isShared;
    }
    if (activeTab === "Shared Lists") {
      return item.isShared;
    }
    return true; // "All Lists"
  });

  const handleCreateList = data => {
    console.log("New List Created:", data);
    // Add logic here to update state or call API
    setCreateListVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header
        variant="title"
        title={"Your Lists"}
        rightAction={
          <TouchableOpacity style={styles.searchButton}>
            <Search size={RFValue(20)} color="#111827" />
          </TouchableOpacity>
        }
        showTabs={
          <View style={styles.filtersRow}>
            <FilterTab
              label="All Lists"
              isActive={activeTab === "All Lists"}
              onPress={() => setActiveTab("All Lists")}
            />
            <FilterTab
              label="Personal Lists"
              isActive={activeTab === "Personal Lists"}
              onPress={() => setActiveTab("Personal Lists")}
            />
            <FilterTab
              label="Shared Lists"
              isActive={activeTab === "Shared Lists"}
              onPress={() => setActiveTab("Shared Lists")}
            />
          </View>
        }
      />
      {/* Custom Header Area */}
      {/* <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Your Lists</Text>
      </View> */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Smart Suggestions (Only visible on All Lists or based on logic) */}
        <View style={styles.smartSuggestionContainer}>
          <View style={styles.smartHeader}>
            <Sparkles size={16} color="#0ea5e9" fill="#0ea5e9" />
            <Text style={styles.smartTitle}>SMART SUGGESTIONS</Text>
          </View>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionContent}>
              <View style={styles.suggestionTitleRow}>
                <Text style={styles.suggestionText}>Reorder Soon</Text>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiText}>AI</Text>
                </View>
              </View>
              <Text style={styles.suggestionSubText}>
                Based on your purchase history
              </Text>
            </View>
            <TouchableOpacity style={styles.suggestionAddBtn}>
              <Plus size={20} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activeTab.toUpperCase()}</Text>
          <TouchableOpacity style={styles.sortButton}>
            <ListFilter size={14} color="#6b7280" style={{marginRight: 4}} />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Lists Cards */}
        <View style={styles.cardsContainer}>
          {filteredData.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate("ListDetails")}>
              {/* Colored Left Border */}
              <View
                style={[styles.cardBorderStrip, {backgroundColor: item.color}]}
              />

              <View style={styles.cardContent}>
                {/* Header: Title + Shared Badge + More Icon */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.isShared && (
                      <View style={styles.sharedBadge}>
                        <Users
                          size={10}
                          color="#0ea5e9"
                          style={{marginRight: 2}}
                        />
                        <Text style={styles.sharedText}>Shared</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setActiveMenuId(activeMenuId === item.id ? null : item.id)
                    }>
                    <MoreHorizontal size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                {/* Category & Time */}
                <Text style={styles.subtitle}>
                  {item.category} • {item.updated}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <ProgressBar
                    completed={item.completedItems}
                    total={item.totalItems}
                    color={item.isCompleted ? "#22c55e" : "#0ea5e9"}
                  />
                </View>

                {/* Footer: Avatars & Completed Badge */}
                <View style={styles.cardFooter}>
                  <AvatarStack images={item.members} />
                  {item.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Check
                        size={12}
                        color="#16a34a"
                        style={{marginRight: 4}}
                      />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>

                {/* Dropdown Menu (Toggle based on activeMenuId) */}
                {/* {activeMenuId === item.id && (
                  <View style={styles.mockMenu}>
                    <TouchableOpacity style={styles.menuItemActive}>
                      <Text style={styles.menuTextBlue}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuItem}>
                      <Text style={styles.menuText}>View</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuItem}>
                      <Text style={styles.menuTextRed}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )} */}
              </View>
            </TouchableOpacity>
          ))}

          {filteredData.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No lists found in this category.
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{height: 80}} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateListVisible(true)}>
        <Plus size={32} color="#fff" />
      </TouchableOpacity>

      <Modal
        isVisible={isCreateListVisible}
        onClose={() => setCreateListVisible(false)}
        onApply={handleCreateList}
        type="createList"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  // Filters
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterTabActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
  },
  filterTextActive: {
    color: "#ffffff",
  },

  // Smart Suggestions
  smartSuggestionContainer: {
    marginBottom: 24,
  },
  smartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  smartTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5", // Very light green
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  aiBadge: {
    backgroundColor: "#a7f3d0", // Greenish
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  aiText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#065f46",
  },
  suggestionSubText: {
    fontSize: RFValue(10),
    color: "#6b7280",
  },
  suggestionAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sortText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#6b7280",
  },

  // Cards
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  cardBorderStrip: {
    width: 6,
    height: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sharedText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#0284c7",
  },
  subtitle: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    marginBottom: 16,
  },

  // Progress
  progressSection: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressStats: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
  },
  progressPercentage: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  track: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    paddingLeft: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
    color: "#15803d",
  },

  // Mock Menu
  // mockMenu: {
  //   position: "absolute",
  //   top: 30,
  //   right: 0,
  //   width: 120,
  //   backgroundColor: "#fff",
  //   borderRadius: 12,
  //   shadowColor: "#000",
  //   shadowOffset: {width: 0, height: 4},
  //   shadowOpacity: 0.15,
  //   shadowRadius: 12,
  //   elevation: 5,
  //   zIndex: 10,
  //   paddingVertical: 4,
  // },
  // menuItem: {
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  // },
  // menuItemActive: {
  //   paddingVertical: 8,
  //   paddingHorizontal: 16,
  //   backgroundColor: "#f0f9ff",
  // },
  // menuText: {
  //   fontSize: RFValue(10),
  //   fontFamily: FontFamily.medium,
  //   color: "#374151",
  // },
  // menuTextBlue: {
  //   fontSize: RFValue(10),
  //   fontFamily: FontFamily.medium,
  //   color: "#0ea5e9",
  // },
  // menuTextRed: {
  //   fontSize: RFValue(10),
  //   fontFamily: FontFamily.medium,
  //   color: "#ef4444",
  // },
  // divider: {
  //   height: 1,
  //   backgroundColor: "#f3f4f6",
  // },

  // Empty State
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default ListsTab;
