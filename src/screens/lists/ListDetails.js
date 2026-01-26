import {useState, useEffect, useCallback, useMemo} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Plus,
  Check,
  MoreHorizontal,
} from "lucide-react-native";
import {useDispatch, useSelector} from "react-redux";
import {useFocusEffect} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {
  fetchListById,
  addItemsToList,
  markItemAsPurchased,
  deleteItemFromList,
} from "~redux/actions/listActions";
import {clearListsError} from "~redux/reducers/listReducer";

const ListDetailsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {listById, loading, error} = useSelector(state => state.lists);

  const listId = route?.params?.listId;
  const list = listId ? listById[listId] : null;

  const [activeTab, setActiveTab] = useState("All Items");
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeItemMenuId, setActiveItemMenuId] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [pendingActions, setPendingActions] = useState(new Set());

  // Fetch list if not cached
  useFocusEffect(
    useCallback(() => {
      if (listId && !list && !loading) {
        dispatch(fetchListById({listId}));
      }
    }, [listId, list, loading, dispatch]),
  );

  console.log("list", JSON.stringify(list, null, 2));

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

  // Statistics
  const {totalItems, purchasedItems, progressPercent} = useMemo(() => {
    const items = list?.items || [];
    const total = items.length;
    const purchased = items.filter(i => i.isPurchased).length;
    return {
      totalItems: total,
      purchasedItems: purchased,
      progressPercent: total === 0 ? 0 : (purchased / total) * 100,
    };
  }, [list?.items]);

  // Filter items by tab
  const {pendingItems, doneItems} = useMemo(() => {
    const items = list?.items || [];
    return {
      pendingItems: items.filter(i => !i.isPurchased),
      doneItems: items.filter(i => i.isPurchased),
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
          items: [{name: itemName}],
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

      const newStatus = !item.isPurchased;
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
          // If unpurchasing, we'd need an API endpoint for that
          // For now, just mark as purchased
          await dispatch(
            markItemAsPurchased({
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
    ({item}) => {
      const itemId = item.id || item._id;
      const isPending = isActionPending(`toggle-${itemId}`) ||
        isActionPending(`delete-${itemId}`);

      return (
        <View style={styles.itemRow}>
          <TouchableOpacity
            style={styles.checkCircleContainer}
            onPress={() => toggleItemStatus(itemId)}
            disabled={isPending}>
            {item.isPurchased ? (
              <View style={styles.checkedCircle}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            ) : (
              <View style={styles.uncheckedCircle} />
            )}
          </TouchableOpacity>

          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemName,
                item.isPurchased && styles.itemNameStrike,
              ]}>
              {item.name}
            </Text>
            <View style={styles.itemMetaRow}>
              <Text style={styles.itemMetaText}>
                {item.isPurchased ? "Purchased" : "Pending"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              setActiveItemMenuId(activeItemMenuId === itemId ? null : itemId)
            }
            hitSlop={10}
            disabled={isPending}>
            <MoreHorizontal size={20} color="#d1d5db" />
          </TouchableOpacity>

          {activeItemMenuId === itemId && (
            <View style={styles.itemMenu}>
              <TouchableOpacity
                style={styles.itemMenuOptionActive}
                onPress={() => toggleItemStatus(itemId)}>
                <Text style={styles.itemMenuTextBlue}>
                  {item.isPurchased ? "Mark Pending" : "Mark Purchased"}
                </Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.itemMenuOption}
                onPress={() => handleDeleteItem(itemId)}>
                <Text style={styles.itemMenuTextRed}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    [
      activeItemMenuId,
      toggleItemStatus,
      handleDeleteItem,
      isActionPending,
    ],
  );

  // Loading state
  if (loading && !list) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  // List not found
  if (!list && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List Not Found</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>List not found or has been deleted.</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setShowHeaderMenu(false);
        setActiveItemMenuId(null);
      }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{list?.name || "List"}</Text>
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

          {showHeaderMenu && (
            <View style={styles.headerMenu}>
              <TouchableOpacity style={styles.headerMenuOptionActive}>
                <Text style={styles.itemMenuTextBlue}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.headerMenuOption}>
                <Text style={styles.itemMenuText}>View</Text>
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
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
              editable={!isActionPending(`add-${listId}`)}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !newItemText.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemText.trim() || isActionPending(`add-${listId}`)}>
              <Plus size={20} color={newItemText.trim() ? "#0ea5e9" : "#d1d5db"} />
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
            {displayItems.length > 0 ? (
              <FlatList
                data={displayItems}
                renderItem={renderItem}
                keyExtractor={item => String(item.id || item._id)}
                scrollEnabled={false}
                ListFooterComponent={
                  activeTab === "All Items" && doneItems.length > 0 ? (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PURCHASED</Text>
                      </View>
                      <FlatList
                        data={doneItems}
                        renderItem={renderItem}
                        keyExtractor={item => String(item.id || item._id)}
                        scrollEnabled={false}
                      />
                    </>
                  ) : null
                }
              />
            ) : (
              <Text style={styles.emptyText}>
                {activeTab === "To Buy"
                  ? "All caught up! Nothing to buy."
                  : doneItems.length > 0
                  ? "No pending items."
                  : "No items in this list."}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 20,
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
    backgroundColor: "#f0f9ff",
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
    backgroundColor: "#e5e7eb",
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
    borderBottomColor: "#111827",
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
  listContainer: {
    gap: 20,
  },
  sectionHeader: {
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#9ca3af",
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
    color: "#9ca3af",
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
    borderColor: "#d1d5db",
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22c55e",
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
  itemMetaText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  itemMenu: {
    position: "absolute",
    right: 0,
    top: 25,
    width: 130,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
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
    backgroundColor: "#eff6ff",
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
