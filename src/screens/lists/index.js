import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
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
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { Menu } from "react-native-paper";
import { Modal, ScrollView, Text } from "~components/Common";
import Header from "~components/Header";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import {
  fetchAllLists,
  deleteList,
  createList,
} from "~redux/actions/listActions";
import { clearListsError } from "~redux/reducers/listReducer";
import { useAlert } from "~context/AlertContext";

// --- Sub Components ---

const FilterTab = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterTab, isActive && styles.filterTabActive]}>
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProgressBar = ({ completed, total, color, label, percentage }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressStats}>
          {label} items
        </Text>
        <Text style={[styles.progressPercentage, { color: color }]}>
          {percentage}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

// Memoized List Card Component
const ListCard = React.memo(
  ({
    item,
    onPress,
    isDeleting,
    menuVisible,
    onOpenMenu,
    onCloseMenu,
    onRequestDelete,
  }) => {
    const totalItems = item.progress?.total || 0;
    const completedItems =
      item.progress?.purchased || 0;
    const isCompleted = totalItems > 0 && completedItems === totalItems;
    const progressColor = item.type === "personal" ? "#16A34A" : isCompleted ? "#22c55e" : "#0ea5e9";

    return (
      <TouchableOpacity
        key={item.id || item._id}
        style={styles.card}
        onPress={onPress}
        disabled={isDeleting}>
        <View
          style={[
            styles.cardBorderStrip,
            { backgroundColor: progressColor },
          ]}
        />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.shareWithCircle && (
                <View style={styles.sharedBadge}>
                  <Users
                    size={10}
                    color="#0ea5e9"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={styles.sharedText}>Shared</Text>
                </View>
              )}
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={onCloseMenu}
              anchor={
                <TouchableOpacity onPress={onOpenMenu} disabled={isDeleting}>
                  <MoreHorizontal size={20} color="#9ca3af" />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}>
              <Menu.Item
                title="Delete"
                titleStyle={styles.menuItemDelete}
                onPress={() => {
                  onCloseMenu();
                  onRequestDelete();
                }}
              />
            </Menu>
          </View>

          <Text style={styles.subtitle}>
            {item.category} • {formatDate(item.createdAt)}
          </Text>

          <View style={styles.progressSection}>
            <ProgressBar
              completed={completedItems}
              total={totalItems}
              color={progressColor}
              percentage={item.progress?.percentage}
              label={item.progress?.label}
            />
          </View>

          <View style={styles.cardFooter}>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Check
                  size={12}
                  color="#16a34a"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Compare all relevant fields that affect rendering
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.items?.length === nextProps.item.items?.length &&
      prevProps.item.progress?.purchased === nextProps.item.progress?.purchased &&
      prevProps.item.progress?.total === nextProps.item.progress?.total &&
      prevProps.item.progress?.percentage === nextProps.item.progress?.percentage &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.menuVisible === nextProps.menuVisible
    );
  },
);

// Helper to format date
const formatDate = date => {
  if (!date) return "Recently";
  const now = new Date();
  const listDate = new Date(date);
  const diffMs = now - listDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

const ListsTab = ({ onQuickAction, navigation, route }) => {
  const dispatch = useDispatch();
  const { lists, loading, error } = useSelector(state => state.lists);
  const { showAlert, showError } = useAlert();

  const [activeTab, setActiveTab] = useState("All Lists");
  const [isCreateListVisible, setCreateListVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [activeMenuListId, setActiveMenuListId] = useState(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [sortOption, setSortOption] = useState("createdOn");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isDismissingRef = useRef(false);

  console.log("lists", lists);

  // Fetch lists on mount and refresh when screen is focused to get latest data
  useFocusEffect(
    useCallback(() => {
      // Refresh when screen is focused to ensure we have latest data
      // This ensures progress updates from ListDetails screen are reflected
      // Only fetch if not already loading to avoid unnecessary calls
      if (!loading) {
        dispatch(fetchAllLists());
      }
    }, [dispatch, loading]),
  );

  // Handle navigation params to switch tabs
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

  // Handle API errors
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: typeof error === "string" ? error : "Something went wrong",
      });
      dispatch(clearListsError());
    }
  }, [error, dispatch]);

  // Sort lists based on selected sort option
  const sortLists = useCallback((listsToSort) => {
    const sorted = [...listsToSort];

    switch (sortOption) {
      case "createdOn":
        // Sort by created date (oldest first)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA - dateB;
        });

      case "recentlyUpdated":
        // Sort by updated date (most recent first)
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });

      case "alphabetical":
        // Sort alphabetically A-Z
        return sorted.sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

      case "mostItems":
        // Sort by total items (most first)
        return sorted.sort((a, b) => {
          const totalA = a.progress?.total || a.items?.length || 0;
          const totalB = b.progress?.total || b.items?.length || 0;
          return totalB - totalA;
        });

      case "leastItems":
        // Sort by total items (least first)
        return sorted.sort((a, b) => {
          const totalA = a.progress?.total || a.items?.length || 0;
          const totalB = b.progress?.total || b.items?.length || 0;
          return totalA - totalB;
        });

      default:
        return sorted;
    }
  }, [sortOption]);

  // Filter and sort lists based on active tab and sort option
  const filteredData = useMemo(() => {
    const filtered = lists.filter(item => {
      if (activeTab === "Personal Lists") {
        return !item.shareWithCircle;
      }
      if (activeTab === "Shared Lists") {
        return item.shareWithCircle;
      }
      return true;
    });

    return sortLists(filtered);
  }, [lists, activeTab, sortLists]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAllLists()).unwrap();
    } catch (err) {
      // Error handled by useEffect
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Delete list handler
  const handleDeleteList = useCallback(
    async listId => {
      setDeletingListId(listId);
      try {
        await dispatch(deleteList({ listId })).unwrap();
        Toast.show({
          type: "success",
          text1: "List Deleted",
          text2: "List has been deleted successfully",
        });
      } catch (err) {
        // Error handled by useEffect, rollback happens automatically
      } finally {
        setDeletingListId(null);
      }
    },
    [dispatch],
  );

  const confirmDeleteList = useCallback(
    (listId, listName) => {
      showAlert({
        title: "Delete List",
        message: `Are you sure you want to delete "${listName || "this list"}"?`,
        type: "confirm",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await handleDeleteList(listId);
              } catch (e) {
                showError("Error", "Failed to delete list. Please try again.");
              }
            },
          },
        ],
      });
    },
    [showAlert, showError, handleDeleteList],
  );

  // Create list handler
  const handleCreateList = useCallback(
    async data => {
      if (isCreatingList) return;
      // Validate
      if (!data.name?.trim()) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "List name is required",
        });
        return;
      }

      if (!data.items || data.items.length === 0) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "Please add at least one item",
        });
        return;
      }

      setIsCreatingList(true);
      try {
        await dispatch(createList(data)).unwrap();
        Toast.show({
          type: "success",
          text1: "List Created",
          text2: "Your list has been created successfully",
        });
        setCreateListVisible(false);
        // Optimistic update already handled, no refetch needed
      } catch (err) {
        // Error handled by useEffect
      } finally {
        setIsCreatingList(false);
      }
    },
    [dispatch, isCreatingList],
  );

  // Navigate to list details
  const handleListPress = useCallback(
    listId => {
      navigation.navigate("ListDetails", { listId });
    },
    [navigation],
  );

  // Handle sort menu toggle with proper state management
  const handleSortMenuToggle = useCallback(() => {
    // Prevent action if currently dismissing
    if (isDismissingRef.current) {
      return;
    }

    // Close any other open menus first to avoid conflicts
    if (activeMenuListId !== null) {
      setActiveMenuListId(null);
    }

    // Toggle menu state
    setShowSortMenu(prev => !prev);
  }, [activeMenuListId]);

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

      {loading && lists.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0ea5e9"
            />
          }>
          {/* Smart Suggestions */}
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
            <Menu
              visible={showSortMenu}
              onDismiss={() => {
                isDismissingRef.current = true;
                setShowSortMenu(false);
                // Reset flag after a short delay to allow state to settle
                setTimeout(() => {
                  isDismissingRef.current = false;
                }, 100);
              }}
              anchor={
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={handleSortMenuToggle}>
                  <ListFilter size={14} color="#6b7280" style={{ marginRight: 4 }} />
                  <Text style={styles.sortText}>Sort</Text>
                </TouchableOpacity>
              }
              contentStyle={styles.sortMenuContent}>
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("createdOn");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Created On"
                titleStyle={[
                  styles.sortMenuItem,
                  sortOption === "createdOn" && styles.sortMenuItemActive,
                ]}
              />
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("recentlyUpdated");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Recently Updated"
                titleStyle={[
                  styles.sortMenuItem,
                  sortOption === "recentlyUpdated" && styles.sortMenuItemActive,
                ]}
              />
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("alphabetical");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Alphabetical A-Z"
                titleStyle={[
                  styles.sortMenuItem,
                  sortOption === "alphabetical" && styles.sortMenuItemActive,
                ]}
              />
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("mostItems");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Most Items"
                titleStyle={[
                  styles.sortMenuItem,
                  sortOption === "mostItems" && styles.sortMenuItemActive,
                ]}
              />
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("leastItems");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Least Items"
                titleStyle={[
                  styles.sortMenuItem,
                  sortOption === "leastItems" && styles.sortMenuItemActive,
                ]}
              />
            </Menu>
          </View>

          {/* Lists Cards */}
          <View style={styles.cardsContainer}>
            {filteredData.map(item => (
              <ListCard
                key={item.id || item._id}
                item={item}
                onPress={() => handleListPress(item.id || item._id)}
                isDeleting={deletingListId === (item.id || item._id)}
                menuVisible={activeMenuListId === (item.id || item._id)}
                onOpenMenu={() => setActiveMenuListId(item.id || item._id)}
                onCloseMenu={() => setActiveMenuListId(null)}
                onRequestDelete={() =>
                  confirmDeleteList(item.id || item._id, item.name)
                }
              />
            ))}

            {filteredData.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No lists found in this category.
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      )}

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
        loading={isCreatingList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
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
    backgroundColor: "#ecfdf5",
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
    backgroundColor: "#a7f3d0",
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
  sortMenuContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 180,
  },
  sortMenuItem: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#111827",
  },
  sortMenuItemActive: {
    color: "#0ea5e9",
    fontFamily: FontFamily.bold,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
  },
  menuContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
  },
  menuItemDelete: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default ListsTab;
