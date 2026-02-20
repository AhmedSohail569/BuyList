import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  Share2,
  MoreVertical,
  Plus,
  Check,
  MoreHorizontal,
} from "lucide-react-native";
import { Menu } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ScrollView, Text } from "~components/Common";
import Header from "~components/Header";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import {
  fetchListById,
  addItemsToList,
  markItemAsPurchased,
  markItemAsUnpurchased,
  deleteItemFromList,
  deleteList,
} from "~redux/actions/listActions";
import { clearListsError } from "~redux/reducers/listReducer";
import { useAlert } from "~context/AlertContext";
import { useTheme } from "~context/ThemeContext";

const ListDetailsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { listById, loading, error } = useSelector(state => state.lists);
  const { showAlert, showError } = useAlert();
  const { colors } = useTheme();

  const listId = route?.params?.listId;
  const list = listId ? listById[listId] : null;

  // Determine if current user is a viewer (read-only) on this list
  const isViewer = list?.userRole?.toLowerCase() === "viewer";

  console.log("list", JSON.stringify(list, null, 2));

  const [activeTab, setActiveTab] = useState("All Items");
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const isHeaderMenuDismissingRef = useRef(false);
  const [activeItemMenuId, setActiveItemMenuId] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [pendingActions, setPendingActions] = useState(new Set());

  // Always fetch list by ID when screen is focused to get latest data
  // This ensures we have the most up-to-date list data from the API
  useFocusEffect(
    useCallback(() => {
      if (listId) {
        // Always fetch to get fresh data, regardless of cached state
        dispatch(fetchListById({ listId }));
      }
    }, [listId, dispatch]),
  );

  // console.log("list", JSON.stringify(list, null, 2));

  // Handle errors
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

  // Prevent duplicate actions
  const isActionPending = useCallback(
    actionKey => {
      return pendingActions.has(actionKey);
    },
    [pendingActions],
  );

  const setActionPending = useCallback((actionKey, isPending) => {
    setPendingActions(prev => {
      const next = new Set(prev);
      if (isPending) {
        next.add(actionKey);
      } else {
        next.delete(actionKey);
      }
      return next;
    });
  }, []);

  // Header menu toggle (guarded to prevent Menu open/close race conditions)
  const handleHeaderMenuToggle = useCallback(() => {
    if (isHeaderMenuDismissingRef.current) return;
    setShowHeaderMenu(prev => !prev);
  }, []);

  const handleDeleteThisList = useCallback(async () => {
    if (!listId) return;

    const actionKey = `delete-list-${listId}`;
    if (isActionPending(actionKey)) return;

    setActionPending(actionKey, true);
    try {
      await dispatch(deleteList({ listId })).unwrap();
      Toast.show({
        type: "success",
        text1: "List Deleted",
        text2: "List has been deleted successfully",
      });
      navigation.goBack();
    } catch (e) {
      showError("Error", "Failed to delete list. Please try again.");
    } finally {
      setActionPending(actionKey, false);
    }
  }, [dispatch, isActionPending, listId, navigation, setActionPending, showError]);

  const confirmDeleteThisList = useCallback(() => {
    setShowHeaderMenu(false);

    showAlert({
      title: "Delete List",
      message: `Are you sure you want to delete "${list?.name || "this list"}"?`,
      type: "confirm",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteThisList,
        },
      ],
    });
  }, [handleDeleteThisList, list?.name, showAlert]);

  // Statistics
  const { totalItems, purchasedItems, progressPercent } = useMemo(() => {
    const items = list?.items || [];
    const total = items.length;
    const purchased = items.filter(i => i.status === "purchased").length;
    return {
      totalItems: total,
      purchasedItems: purchased,
      progressPercent: total === 0 ? 0 : (purchased / total) * 100,
    };
  }, [list?.items]);

  // Filter items by tab
  const { pendingItems, doneItems } = useMemo(() => {
    const items = list?.items || [];
    return {
      pendingItems: items.filter(i => i.status === "pending"),
      doneItems: items.filter(i => i.status === "purchased"),
    };
  }, [list?.items]);

  // Display items based on active tab
  // "All Items" shows only pending items, purchased items appear in separate section below
  const displayItems = useMemo(() => {
    // Both tabs show only pending items in main list
    // Purchased items are shown separately in "Purchased" section
    return pendingItems;
  }, [pendingItems]);

  // Add item handler
  const handleAddItem = useCallback(async () => {
    if (!listId || !newItemText.trim()) return;

    const itemName = newItemText.trim();
    const actionKey = `add-${listId}-${itemName}`;

    if (isActionPending(actionKey)) return;

    setActionPending(actionKey, true);
    setNewItemText("");

    try {
      await dispatch(
        addItemsToList({
          listId,
          items: [{ name: itemName }],
        }),
      ).unwrap();
      // Optimistic update handled by reducer
    } catch (err) {
      // Error handled by useEffect, rollback automatic
      setNewItemText(itemName); // Restore text on error
    } finally {
      setActionPending(actionKey, false);
    }
  }, [listId, newItemText, dispatch, isActionPending, setActionPending]);

  // Toggle item purchased status
  const toggleItemStatus = useCallback(
    async itemId => {
      if (!listId || isActionPending(`toggle-${itemId}`)) return;

      const item = list?.items?.find(
        i => (i.id || i._id) === itemId,
      );
      if (!item) return;

      const newStatus = item.status === "pending";
      setActionPending(`toggle-${itemId}`, true);

      try {
        if (newStatus) {
          await dispatch(
            markItemAsPurchased({
              listId,
              itemId,
            }),
          ).unwrap();
        } else {
          await dispatch(
            markItemAsUnpurchased({
              listId,
              itemId,
            }),
          ).unwrap();
        }
        // Optimistic update handled by reducer
      } catch (err) {
        // Error handled by useEffect, rollback automatic
      } finally {
        setActionPending(`toggle-${itemId}`, false);
      }
    },
    [listId, list, dispatch, isActionPending, setActionPending],
  );

  // Delete item handler
  const handleDeleteItem = useCallback(
    async itemId => {
      if (!listId || isActionPending(`delete-${itemId}`)) return;

      setActionPending(`delete-${itemId}`, true);
      setActiveItemMenuId(null);

      try {
        await dispatch(
          deleteItemFromList({
            listId,
            itemId,
          }),
        ).unwrap();
        // Optimistic update handled by reducer
      } catch (err) {
        // Error handled by useEffect, rollback automatic
      } finally {
        setActionPending(`delete-${itemId}`, false);
      }
    },
    [listId, dispatch, isActionPending, setActionPending],
  );

  // Render item row
  const renderItem = useCallback(
    ({ item }) => {
      const itemId = item.id || item._id;
      const isPending = isActionPending(`toggle-${itemId}`) ||
        isActionPending(`delete-${itemId}`);
      const isMenuOpen = activeItemMenuId === itemId;

      return (
        <View style={styles.itemRow}>
          <TouchableOpacity
            style={styles.checkCircleContainer}
            onPress={() => toggleItemStatus(itemId)}
            activeOpacity={0.8}
            disabled={isPending}>
            {item.status === "purchased" ? (
              <View style={[styles.checkedCircle, { backgroundColor: colors.success }]}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            ) : (
              <View style={[styles.uncheckedCircle, { borderColor: colors.border }]} />
            )}
          </TouchableOpacity>

          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemName,
                { color: colors.textPrimary },
                item.status === "purchased" && [styles.itemNameStrike, { color: colors.textSecondary }],
              ]}
              numberOfLines={3}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={styles.itemMetaRow}>
              <Text style={[styles.itemMetaText, { color: colors.textMuted }]}>
                {item.status === "purchased"
                  ? item.purchasedBy?.username
                    ? `Purchased by ${item.purchasedBy.username}`
                    : "Purchased"
                  : "Pending"}
              </Text>
            </View>
          </View>

          <Menu
            visible={isMenuOpen}
            onDismiss={() => setActiveItemMenuId(null)}
            anchor={
              <TouchableOpacity
                onPress={() => setActiveItemMenuId(itemId)}
                hitSlop={10}
                disabled={isPending}>
                <MoreHorizontal size={20} color={colors.iconMuted} />
              </TouchableOpacity>
            }
            contentStyle={[styles.menuContent, { backgroundColor: colors.card }]}>
            <Menu.Item
              onPress={() => {
                setActiveItemMenuId(null);
                toggleItemStatus(itemId);
              }}
              title={item.status === "purchased" ? "Pending" : "Purchased"}
              titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
            />
            <Menu.Item
              onPress={() => {
                setActiveItemMenuId(null);
                handleDeleteItem(itemId);
              }}
              title="Delete"
              titleStyle={styles.menuItemTitleDelete}
            />
          </Menu>
        </View>
      );
    },
    [
      activeItemMenuId,
      toggleItemStatus,
      handleDeleteItem,
      isActionPending,
      colors,
    ],
  );

  // Loading state - only show spinner if we don't have cached data
  // If we have cached data, show it while fetching fresh data in background
  if (loading && !list) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // List not found - only show if we're not loading and have no cached data
  if (!list && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          variant="screen"
          title="List Not Found"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>List not found or has been deleted.</Text>
        </View>
      </View>
    );
  }

  console.log("list", list);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={list?.name || "List"}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Share2 size={22} color={colors.icon} />
            </TouchableOpacity>
            <Menu
              visible={showHeaderMenu}
              onDismiss={() => {
                isHeaderMenuDismissingRef.current = true;
                setShowHeaderMenu(false);
                setTimeout(() => {
                  isHeaderMenuDismissingRef.current = false;
                }, 100);
              }}
              anchor={
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleHeaderMenuToggle}>
                  <MoreVertical size={22} color={colors.icon} />
                </TouchableOpacity>
              }
              contentStyle={[styles.menuContent, { backgroundColor: colors.card }]}>
              <Menu.Item
                onPress={() => {
                  setShowHeaderMenu(false);
                  // Handle edit action
                }}
                title="Edit"
                titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
              />
              <Menu.Item
                onPress={() => {
                  isHeaderMenuDismissingRef.current = true;
                  confirmDeleteThisList();
                  setTimeout(() => {
                    isHeaderMenuDismissingRef.current = false;
                  }, 100);
                }}
                title="Delete"
                titleStyle={styles.menuItemTitleDelete}
              />
            </Menu>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {purchasedItems}/{totalItems} purchased
            </Text>
            <Text style={[styles.progressPercentText, { color: colors.primary }]}>
              {Math.round(progressPercent)}%
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.progressTrack }]}>
            <View style={[styles.fill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Add Item Input — disabled for viewers */}
        <View style={[
          styles.inputContainer,
          { borderColor: colors.border, backgroundColor: colors.card },
          isViewer && { opacity: 0.5 },
        ]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder={isViewer ? "You have view-only access" : "Add an item..."}
            placeholderTextColor={colors.inputPlaceholder}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            editable={!isViewer && !isActionPending(`add-${listId}`)}
            maxLength={50}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              { backgroundColor: colors.backgroundSecondary },
              (!newItemText.trim() || isViewer) && styles.addButtonDisabled,
            ]}
            onPress={handleAddItem}
            disabled={isViewer || !newItemText.trim() || isActionPending(`add-${listId}`)}>
            <Plus size={20} color={!isViewer && newItemText.trim() ? colors.primary : colors.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "All Items" && [styles.activeTab, { borderBottomColor: colors.textPrimary }],
            ]}
            onPress={() => setActiveTab("All Items")}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === "All Items" && [styles.activeTabText, { color: colors.textPrimary }],
              ]}>
              All Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "To Buy" && [styles.activeTab, { borderBottomColor: colors.textPrimary }]]}
            onPress={() => setActiveTab("To Buy")}>
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === "To Buy" && [styles.activeTabText, { color: colors.textPrimary }],
              ]}>
              To Buy ({pendingItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item List */}
        <View style={styles.listContainer}>
          {activeTab === "To Buy" ? (
            displayItems.length > 0 ? (
              <FlatList
                data={displayItems}
                renderItem={renderItem}
                keyExtractor={item => String(item.id || item._id)}
                scrollEnabled={false}
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>All caught up! Nothing to buy.</Text>
            )
          ) : (
            <>
              {/* Pending items (may be empty) */}
              {displayItems.length > 0 ? (
                <FlatList
                  data={displayItems}
                  renderItem={renderItem}
                  keyExtractor={item => String(item.id || item._id)}
                  scrollEnabled={false}
                />
              ) : null}

              {/* Purchased items should always render when present (even if all items are purchased) */}
              {doneItems.length > 0 ? (
                <>
                  <View style={[styles.sectionHeader, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PURCHASED</Text>
                  </View>
                  <FlatList
                    data={doneItems}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.id || item._id)}
                    scrollEnabled={false}
                  />
                </>
              ) : null}

              {/* Empty state when there are no items at all */}
              {displayItems.length === 0 && doneItems.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No items in this list.</Text>
              ) : null}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  iconButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
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
    fontFamily: FontFamily.medium,
  },
  progressPercentText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  track: {
    height: 6,
    borderRadius: 3,
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 20,
    gap: 24,
  },
  tab: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  activeTabText: {
    fontFamily: FontFamily.bold,
  },
  listContainer: {
    gap: 20,
  },
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontFamily: FontFamily.regular,
    fontSize: RFValue(12),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 1,
    marginBottom: 16,
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
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    marginBottom: 4,
  },
  itemNameStrike: {
    textDecorationLine: "line-through",
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemMetaText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
  },
  menuContent: {
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 150,
  },
  menuItemTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  menuItemTitleDelete: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
});

export default ListDetailsScreen;
