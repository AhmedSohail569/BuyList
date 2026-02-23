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
import { useTheme } from "~context/ThemeContext";

// --- Sub Components ---

const FilterTab = ({ label, isActive, onPress, colors, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.filterTab,
      {
        backgroundColor: isActive ? (isDark ? colors.primary : "#111827") : colors.card,
        borderColor: isActive ? (isDark ? colors.primary : "#111827") : colors.border,
      },
    ]}>
    <Text
      style={[
        styles.filterText,
        { color: isActive ? "#ffffff" : colors.textMuted },
      ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProgressBar = ({ completed, total, color, label, percentage, colors }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextRow}>
        <Text style={[styles.progressStats, { color: colors.textSecondary }]}>
          {label} items
        </Text>
        <Text style={[styles.progressPercentage, { color: color }]}>
          {percentage}%
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
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
    const { colors, isDark } = useTheme();
    const totalItems = item.progress?.total || 0;
    const completedItems =
      item.progress?.purchased || 0;
    const isCompleted = totalItems > 0 && completedItems === totalItems;
    const progressColor = item.type === "personal" ? "#16A34A" : isCompleted ? "#22c55e" : "#0ea5e9";

    return (
      <TouchableOpacity
        key={item.id || item._id}
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
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
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.name}</Text>
              {item.shareWithCircle && (
                <View style={[styles.sharedBadge, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe" }]}>
                  <Users
                    size={10}
                    color="#0ea5e9"
                    style={{ marginRight: 2 }}
                  />
                  <Text style={[styles.sharedText, { color: colors.primary }]}>Shared</Text>
                </View>
              )}
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={onCloseMenu}
              anchor={
                <TouchableOpacity onPress={onOpenMenu} disabled={isDeleting}>
                  <MoreHorizontal size={20} color={colors.iconMuted} />
                </TouchableOpacity>
              }
              contentStyle={[styles.menuContent, { backgroundColor: colors.card }]}>
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

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {item.category} • {formatDate(item.createdAt)}
          </Text>

          <View style={styles.progressSection}>
            <ProgressBar
              completed={completedItems}
              total={totalItems}
              color={progressColor}
              percentage={item.progress?.percentage}
              label={item.progress?.label}
              colors={colors}
            />
          </View>

          <View style={styles.cardFooter}>
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: isDark ? "rgba(22, 163, 74, 0.2)" : "#dcfce7" }]}>
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
    // Note: colors/isDark are now accessed via useTheme hook inside component,
    // so they don't need to be in the comparison
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
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState("All Lists");
  const [isCreateListVisible, setCreateListVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [activeMenuListId, setActiveMenuListId] = useState(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [sortOption, setSortOption] = useState("priority");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const isDismissingRef = useRef(false);
  const isFetchingOnFocusRef = useRef(false);

  // Open create list modal when navigated from other tabs (e.g. Home "Create" quick action)
  useFocusEffect(
    useCallback(() => {
      const shouldOpen = route?.params?.openCreateListModal;
      if (shouldOpen && !isCreateListVisible) {
        setCreateListVisible(true);
      }
      if (shouldOpen) {
        // Clear the param so it doesn't re-open on every focus
        navigation.setParams?.({ openCreateListModal: undefined });
      }
    }, [route?.params?.openCreateListModal, isCreateListVisible, navigation]),
  );

  // Fetch lists on mount and refresh when screen is focused to get latest data
  useFocusEffect(
    useCallback(() => {
      // Refresh when screen is focused to ensure we have latest data.
      // IMPORTANT: don't depend on `loading` here; it changes during fetch and can re-trigger this effect.
      if (isFetchingOnFocusRef.current) return;

      isFetchingOnFocusRef.current = true;
      dispatch(fetchAllLists())
        .unwrap()
        .catch(() => {
          // Errors handled by existing `error` effect/toast
        })
        .finally(() => {
          isFetchingOnFocusRef.current = false;
        });
    }, [dispatch]),
  );

  // Handle navigation params to switch tabs - use useFocusEffect to handle when screen is focused
  useFocusEffect(
    useCallback(() => {
      const filter = route?.params?.filter;
      if (filter) {
        const filterParam = String(filter).toLowerCase();
        if (filterParam === "shared") {
          setActiveTab("Shared Lists");
        } else if (filterParam === "personal") {
          setActiveTab("Personal Lists");
        } else {
          setActiveTab("All Lists");
        }
        // Clear the filter param after processing to allow re-navigation
        navigation.setParams?.({ filter: undefined });
      }
    }, [route?.params?.filter, navigation])
  );

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
      case "priority":
        // Sort by priority (High > Medium > Low)
        return sorted.sort((a, b) => {
          const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };
          const pA = PRIORITY_VALUE[a.priority?.toLowerCase()] || 0;
          const pB = PRIORITY_VALUE[b.priority?.toLowerCase()] || 0;

          if (pA !== pB) return pB - pA;

          // Secondary sort: Most recently updated
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });

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
        return item.type === "personal";
      }
      if (activeTab === "Shared Lists") {
        return item.type === "shared";
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="title"
        title={"Your Lists"}
        rightAction={
          <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
            <Search size={RFValue(20)} color={colors.textPrimary} />
          </TouchableOpacity>
        }
        showTabs={
          <View style={styles.filtersRow}>
            <FilterTab
              label="All Lists"
              isActive={activeTab === "All Lists"}
              onPress={() => setActiveTab("All Lists")}
              colors={colors}
              isDark={isDark}
            />
            <FilterTab
              label="Personal Lists"
              isActive={activeTab === "Personal Lists"}
              onPress={() => setActiveTab("Personal Lists")}
              colors={colors}
              isDark={isDark}
            />
            <FilterTab
              label="Shared Lists"
              isActive={activeTab === "Shared Lists"}
              onPress={() => setActiveTab("Shared Lists")}
              colors={colors}
              isDark={isDark}
            />
          </View>
        }
      />

      {loading && lists.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }>
          {/* Smart Suggestions */}
          <View style={styles.smartSuggestionContainer}>
            <View style={styles.smartHeader}>
              <Sparkles size={16} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.smartTitle, { color: colors.textMuted }]}>SMART SUGGESTIONS</Text>
            </View>
            <View style={[styles.suggestionCard, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5", borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#d1fae5" }]}>
              <View style={styles.suggestionContent}>
                <View style={styles.suggestionTitleRow}>
                  <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>Reorder Soon</Text>
                  <View style={[styles.aiBadge, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#a7f3d0" }]}>
                    <Text style={[styles.aiText, { color: isDark ? "#34d399" : "#065f46" }]}>AI</Text>
                  </View>
                </View>
                <Text style={[styles.suggestionSubText, { color: colors.textMuted }]}>
                  Based on your purchase history
                </Text>
              </View>
              <TouchableOpacity style={[styles.suggestionAddBtn, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
                <Plus size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{activeTab.toUpperCase()}</Text>
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
                  style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleSortMenuToggle}>
                  <ListFilter size={14} color={colors.iconMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.sortText, { color: colors.textMuted }]}>Sort</Text>
                </TouchableOpacity>
              }
              contentStyle={[styles.sortMenuContent, { backgroundColor: colors.card }]}>
              <Menu.Item
                onPress={() => {
                  isDismissingRef.current = true;
                  setSortOption("priority");
                  setShowSortMenu(false);
                  setTimeout(() => {
                    isDismissingRef.current = false;
                  }, 100);
                }}
                title="Priority"
                titleStyle={[
                  styles.sortMenuItem,
                  { color: sortOption === "priority" ? colors.primary : colors.textPrimary },
                ]}
              />
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
                  { color: sortOption === "createdOn" ? colors.primary : colors.textPrimary },
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
                  { color: sortOption === "recentlyUpdated" ? colors.primary : colors.textPrimary },
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
                  { color: sortOption === "alphabetical" ? colors.primary : colors.textPrimary },
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
                  { color: sortOption === "mostItems" ? colors.primary : colors.textPrimary },
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
                  { color: sortOption === "leastItems" ? colors.primary : colors.textPrimary },
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
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
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
  },
  filterText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
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
