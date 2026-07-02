import {useState, useEffect, useCallback, useMemo, useRef} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  Share2,
  MoreVertical,
  Plus,
  Check,
  MoreHorizontal,
} from "lucide-react-native";
import Popover from "react-native-popover-view";
import {useDispatch, useSelector} from "react-redux";
import {useFocusEffect, CommonActions} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {ScrollView, Text, ItemPriorityModal} from "~components/Common";
import Header from "~components/Header";
import SelectionModal from "~containers/modals/SelectionModal";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import useOnReconnect from "~hooks/useOnReconnect";
import {
  fetchListById,
  addItemsToList,
  markItemAsPurchased,
  markItemAsUnpurchased,
  deleteItemFromList,
  deleteList,
  updateItemPriority,
  updateListName,
  updateItemName,
  getComments,
  addComment,
} from "~redux/actions/listActions";
import {clearListsError} from "~redux/reducers/listReducer";
import {useAlert} from "~context/AlertContext";
import {useTheme} from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";
import {Images} from "~assets";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const ListDetailsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {
    listById,
    loading,
    error,
    comments = {},
    commentsLoading,
    commentsSending,
  } = useSelector(state => state.lists);
  const {profile} = useSelector(state => state.profile);
  const {showAlert, showError} = useAlert();
  const {colors} = useTheme();
  const {t} = useTranslation();

  const listId = route?.params?.listId;
  const list = listId ? listById[listId] : null;

  // Determine if current user is a viewer (read-only) on this list
  const isViewer = list?.userRole?.toLowerCase() === "viewer";

  const listRenamedRef = useRef(false);
  const flatListRef = useRef(null);
  // Tracks the intended status for in-flight toggles so concurrent API responses
  // don't cause items to flash back to their previous state mid-batch.
  const optimisticStatusRef = useRef({});

  const handleGoBack = useCallback(() => {
    if (listRenamedRef.current) {
      listRenamedRef.current = false;
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "AppTabNavigator",
              params: {
                screen: "Lists",
                params: {
                  screen: "ListsTab",
                  params: {listNameUpdated: true},
                },
              },
            },
          ],
        }),
      );
    } else {
      navigation.goBack();
    }
  }, [navigation]);

  const [mainTab, setMainTab] = useState("Items"); // "Items" | "Messages"
  const [activeTab, setActiveTab] = useState("All Items");
  const [messageText, setMessageText] = useState("");
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const isHeaderMenuDismissingRef = useRef(false);
  const [activeItemMenuId, setActiveItemMenuId] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [pendingActions, setPendingActions] = useState(new Set());

  // Priority modal state
  const [priorityModal, setPriorityModal] = useState({
    visible: false,
    itemId: null,
    current: "medium",
  });

  // Rename modal state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameItemModal, setRenameItemModal] = useState({
    visible: false,
    itemId: null,
    currentName: "",
  });

  // Always fetch list by ID when screen is focused to get latest data
  // This ensures we have the most up-to-date list data from the API
  useFocusEffect(
    useCallback(() => {
      if (listId) {
        // Always fetch to get fresh data, regardless of cached state
        dispatch(fetchListById({listId}));
        dispatch(getComments({listId}));
      }
    }, [listId, dispatch]),
  );

  // Re-fetch list when internet reconnects
  useOnReconnect(() => {
    if (listId) dispatch(fetchListById({listId}));
  });
  console.log("listId", listId);
  // Handle errors
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: t("listdetails_error"),
        text2: typeof error === "string" ? error : t("listdetails_error_desc"),
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

  // Stores the action to run after the popover fully closes (iOS modal-in-modal fix)
  const pendingActionRef = useRef(null);

  // Header menu toggle (guarded to prevent Menu open/close race conditions)
  const handleHeaderMenuToggle = useCallback(() => {
    if (isHeaderMenuDismissingRef.current) return;
    setShowHeaderMenu(prev => !prev);
  }, []);

  const handleRenameList = useCallback(
    async newName => {
      const trimmed = newName?.trim();
      if (!trimmed || trimmed === list?.name || !listId) return;
      try {
        await dispatch(updateListName({listId, name: trimmed})).unwrap();
        dispatch(fetchListById({listId}));
        listRenamedRef.current = true;
      } catch {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to rename list.",
        });
      }
    },
    [dispatch, listId, list?.name, navigation],
  );

  const handleRenameItem = useCallback(
    async newName => {
      const trimmed = newName?.trim();
      const {itemId, currentName} = renameItemModal;
      if (!trimmed || trimmed === currentName || !listId || !itemId) return;
      try {
        await dispatch(
          updateItemName({listId, itemId, name: trimmed}),
        ).unwrap();
      } catch {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to rename item.",
        });
      }
    },
    [dispatch, listId, renameItemModal],
  );

  const handleSetPriority = useCallback(
    async selectedPriority => {
      const {itemId} = priorityModal;
      setPriorityModal(prev => ({...prev, visible: false}));
      if (!listId || !itemId) return;
      try {
        await dispatch(
          updateItemPriority({listId, itemId, priority: selectedPriority}),
        ).unwrap();
      } catch {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to update priority.",
        });
      }
    },
    [priorityModal, listId, dispatch],
  );

  const handleDeleteThisList = useCallback(async () => {
    if (!listId) return;

    const actionKey = `delete-list-${listId}`;
    if (isActionPending(actionKey)) return;

    setActionPending(actionKey, true);
    try {
      await dispatch(deleteList({listId})).unwrap();
      Toast.show({
        type: "success",
        text1: t("listdetails_deleted_title"),
        text2: t("listdetails_deleted_desc"),
      });
      navigation.goBack();
    } catch (e) {
      showError("Error", "Failed to delete list. Please try again.");
    } finally {
      setActionPending(actionKey, false);
    }
  }, [
    dispatch,
    isActionPending,
    listId,
    navigation,
    setActionPending,
    showError,
  ]);

  const confirmDeleteThisList = useCallback(() => {
    setShowHeaderMenu(false);

    showAlert({
      title: t("listdetails_delete_title"),
      message: `${t("listdetails_delete_message")} "${
        list?.name || t("lists_delete_this")
      }"?`,
      type: "confirm",
      buttons: [
        {text: t("listdetails_cancel"), style: "cancel"},
        {
          text: t("listdetails_delete"),
          style: "destructive",
          onPress: handleDeleteThisList,
        },
      ],
    });
  }, [handleDeleteThisList, list?.name, showAlert]);

  // Statistics
  const {totalItems, purchasedItems, progressPercent} = useMemo(() => {
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
  const {pendingItems, doneItems} = useMemo(() => {
    const PRIORITY_ORDER = {high: 0, medium: 1, low: 2};
    const items = list?.items || [];
    return {
      pendingItems: items
        .filter(i => i.status === "pending")
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[a.priority] ?? 3) -
            (PRIORITY_ORDER[b.priority] ?? 3),
        ),
      doneItems: items
        .filter(i => i.status === "purchased")
        .sort(
          (a, b) =>
            (PRIORITY_ORDER[a.priority] ?? 3) -
            (PRIORITY_ORDER[b.priority] ?? 3),
        ),
    };
  }, [list?.items]);

  const {allItems} = useMemo(() => {
    const items = list?.progress?.total || 0;
    return {
      allItems: items,
    };
  }, [list?.progress]);

  // Messages state from Redux
  const messages = useMemo(() => comments?.[listId] || [], [comments, listId]);

  const insets = useSafeAreaInsets();

  const handleSendMessage = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    // Dispatch Redux action
    dispatch(addComment({listId, text: trimmed}));
    setMessageText("");
  }, [messageText, listId, dispatch]);

  const renderMessageItem = useCallback(({item, index}) => {
    const prevItem = index > 0 ? messages[index - 1] : null;
    const showDateHeader =
      !prevItem ||
      new Date(item.createdAt).toDateString() !==
        new Date(prevItem.createdAt).toDateString();

    let dateHeaderText = "";
    if (showDateHeader) {
      const date = new Date(item.createdAt);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === now.toDateString()) {
        dateHeaderText = t("common_today") || "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateHeaderText = t("common_yesterday") || "Yesterday";
      } else {
        dateHeaderText = date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }

    const author = item.author || {username: "Unknown"};
    const timeString = new Date(item.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const initial = author.username
      ? author.username.charAt(0).toUpperCase()
      : "U";

    const messageRow = item.isMine ? (
      <View style={styles.myMsgRow}>
        <View
          style={[
            styles.myMsgBubble,
            {backgroundColor: colors.msgMyBubble},
          ]}>
          <View style={styles.myMsgHeader}>
            <Text style={[styles.myMsgName, {color: colors.msgMyName}]}>
              Me
            </Text>
            <Text style={[styles.myMsgTime, {color: colors.msgTimestamp}]}>
              {timeString}
            </Text>
          </View>
          <Text style={[styles.myMsgText, {color: colors.msgMyText}]}>
            {item.text}
          </Text>
        </View>
        <View
          style={[
            styles.avatarCircle,
            {backgroundColor: colors.primary, overflow: "hidden"},
          ]}>
          {profile?.profilePicture || author.profilePicture ? (
            <Image
              source={{
                uri: profile?.profilePicture || author.profilePicture,
              }}
              style={{width: "100%", height: "100%"}}
            />
          ) : (
            <Text style={[styles.avatarInitial, {color: colors.textInverse}]}>
              {initial}
            </Text>
          )}
        </View>
      </View>
    ) : (
      <View style={styles.otherMsgRow}>
        <View
          style={[
            styles.avatarCircle,
            {backgroundColor: colors.card, overflow: "hidden"},
          ]}>
          {author.profilePicture ? (
            <Image
              source={{uri: author.profilePicture}}
              style={{width: "100%", height: "100%"}}
            />
          ) : (
            <Text style={[styles.avatarInitial, {color: colors.textPrimary}]}>
              {initial}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.otherMsgBubble,
            {
              backgroundColor: colors.card,
              shadowColor: colors.shadowColor || "#000",
            },
          ]}>
          <View style={styles.otherMsgHeader}>
            <Text style={[styles.otherMsgName, {color: colors.textPrimary}]}>
              {author.username}
            </Text>
            <Text style={[styles.otherMsgTime, {color: colors.msgTimestamp}]}>
              {timeString}
            </Text>
          </View>
          <Text style={[styles.otherMsgText, {color: colors.msgOtherText}]}>
            {item.text}
          </Text>
        </View>
      </View>
    );

    if (showDateHeader) {
      return (
        <View style={{width: "100%"}}>
          <Text
            style={[
              styles.dateHeaderText,
              {
                color: colors.textSecondary,
                width: "100%",
                textAlign: "center",
                marginVertical: 12,
              },
            ]}>
            {dateHeaderText}
          </Text>
          {messageRow}
        </View>
      );
    }

    return messageRow;
  }, [messages, t, colors, profile]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        if (mainTab === "Messages") {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        }
      },
    );
    return () => keyboardListener.remove();
  }, [mainTab]);

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

      const item = list?.items?.find(i => (i.id || i._id) === itemId);
      if (!item) return;

      const isPurchasing = item.status === "pending";
      // Pin the intended status immediately so concurrent server responses for
      // other in-flight toggles can't cause this item to flash back to its old state.
      optimisticStatusRef.current[itemId] = isPurchasing
        ? "purchased"
        : "pending";
      setActionPending(`toggle-${itemId}`, true);

      try {
        if (isPurchasing) {
          await dispatch(markItemAsPurchased({listId, itemId})).unwrap();
        } else {
          await dispatch(markItemAsUnpurchased({listId, itemId})).unwrap();
        }
      } catch {
        // On failure, clear the pin so the item reverts to its actual server state.
        delete optimisticStatusRef.current[itemId];
      } finally {
        setActionPending(`toggle-${itemId}`, false);
        delete optimisticStatusRef.current[itemId];
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
      const isPending =
        isActionPending(`toggle-${itemId}`) ||
        isActionPending(`delete-${itemId}`);
      const isMenuOpen = activeItemMenuId === itemId;
      // Prefer the locally-pinned intended status over Redux state so the UI
      // stays stable while other concurrent toggle API calls are still in-flight.
      const effectiveStatus =
        optimisticStatusRef.current[itemId] ?? item.status;

      return (
        <View style={styles.itemRow}>
          {!isViewer && (
            <TouchableOpacity
              style={styles.checkCircleContainer}
              onPress={() => toggleItemStatus(itemId)}
              activeOpacity={0.8}
              disabled={isPending}>
              {effectiveStatus === "purchased" ? (
                <View
                  style={[
                    styles.checkedCircle,
                    {backgroundColor: colors.success},
                  ]}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </View>
              ) : (
                <View
                  style={[styles.uncheckedCircle, {borderColor: colors.border}]}
                />
              )}
            </TouchableOpacity>
          )}

          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemName,
                {color: colors.textPrimary},
                effectiveStatus === "purchased" && [
                  styles.itemNameStrike,
                  {color: colors.textSecondary},
                ],
              ]}
              numberOfLines={3}
              ellipsizeMode="tail">
              {item.name}
            </Text>
            <View style={styles.itemMetaRow}>
              <Text style={[styles.itemMetaText, {color: colors.textMuted}]}>
                {effectiveStatus === "purchased"
                  ? item.purchasedBy?.username
                    ? `Completed by ${item.purchasedBy.username}`
                    : "Completed"
                  : "Pending"}
              </Text>
              {item.priority && item.priority !== "none" && (
                <View
                  style={[
                    styles.priorityTag,
                    {
                      backgroundColor:
                        item.priority === "high"
                          ? colors.errorLight
                          : item.priority === "medium"
                          ? colors.blueLight
                          : colors.greenLight,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.priorityTagText,
                      {
                        color:
                          item.priority === "high"
                            ? colors.error
                            : item.priority === "medium"
                            ? colors.blue
                            : colors.green,
                      },
                    ]}>
                    {item.priority.charAt(0).toUpperCase() +
                      item.priority.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!isViewer && (
            <Popover
              isVisible={isMenuOpen}
              onRequestClose={() => setActiveItemMenuId(null)}
              onCloseComplete={() => {
                // The custom patch removed the native unmount delay; we must delay the next modal here
                if (pendingActionRef.current) {
                  const action = pendingActionRef.current;
                  setTimeout(() => {
                    action();
                  }, 400);
                  pendingActionRef.current = null;
                }
              }}
              from={(sourceRef, showPopover) => (
                <TouchableOpacity
                  ref={sourceRef}
                  onPress={() => {
                    showPopover();
                    setActiveItemMenuId(itemId);
                  }}
                  hitSlop={10}
                  disabled={isPending}>
                  <MoreHorizontal size={20} color={colors.iconMuted} />
                </TouchableOpacity>
              )}
              popoverStyle={[
                styles.menuContent,
                {backgroundColor: colors.card},
              ]}>
              <View style={{paddingVertical: 4}}>
                {effectiveStatus !== "purchased" && (
                  <TouchableOpacity
                    onPress={() => {
                      const currentItem = list?.items?.find(
                        i => (i.id || i._id) === itemId,
                      );
                      pendingActionRef.current = () =>
                        setRenameItemModal({
                          visible: true,
                          itemId,
                          currentName: currentItem?.name || "",
                        });
                      setActiveItemMenuId(null);
                    }}
                    style={{paddingHorizontal: 16, paddingVertical: 12}}>
                    <Text
                      style={[
                        styles.menuItemTitle,
                        {color: colors.textPrimary},
                      ]}>
                      Rename
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    const currentItem = list?.items?.find(
                      i => (i.id || i._id) === itemId,
                    );
                    pendingActionRef.current = () =>
                      setPriorityModal({
                        visible: true,
                        itemId,
                        current: currentItem?.priority || "medium",
                      });
                    setActiveItemMenuId(null);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[styles.menuItemTitle, {color: colors.textPrimary}]}>
                    Set Priority
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    pendingActionRef.current = () => toggleItemStatus(itemId);
                    setActiveItemMenuId(null);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[styles.menuItemTitle, {color: colors.textPrimary}]}>
                    {effectiveStatus === "purchased" ? "Pending" : "Completed"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    pendingActionRef.current = () => handleDeleteItem(itemId);
                    setActiveItemMenuId(null);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text style={styles.menuItemTitleDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Popover>
          )}
        </View>
      );
    },
    [
      activeItemMenuId,
      toggleItemStatus,
      handleDeleteItem,
      isActionPending,
      colors,
      isViewer,
      renameItemModal,
    ],
  );

  // Loading state - only show spinner if we don't have cached data
  // If we have cached data, show it while fetching fresh data in background
  if (loading && !list) {
    return (
      <View
        style={[styles.loadingContainer, {backgroundColor: colors.background}]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // List not found - only show if we're not loading and have no cached data
  if (!list && !loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          variant="screen"
          title="List Not Found"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            List not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Header
          variant="screen"
          title={list?.name || "List"}
          onBack={handleGoBack}
          rightAction={
            !isViewer ? (
              <View style={styles.headerActions}>
                {/* <TouchableOpacity style={styles.iconButton}>
                <Share2 size={22} color={colors.icon} />
              </TouchableOpacity> */}
                <Popover
                  isVisible={showHeaderMenu}
                  onRequestClose={() => {
                    isHeaderMenuDismissingRef.current = true;
                    setShowHeaderMenu(false);
                    setTimeout(() => {
                      isHeaderMenuDismissingRef.current = false;
                    }, 100);
                  }}
                  onCloseComplete={() => {
                    if (pendingActionRef.current) {
                      const action = pendingActionRef.current;
                      setTimeout(() => {
                        action();
                      }, 400);
                      pendingActionRef.current = null;
                    }
                  }}
                  from={(sourceRef, showPopover) => (
                    <TouchableOpacity
                      ref={sourceRef}
                      style={styles.iconButton}
                      onPress={() => {
                        showPopover();
                        handleHeaderMenuToggle();
                      }}>
                      <MoreVertical size={22} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                  popoverStyle={[
                    styles.menuContent,
                    {backgroundColor: colors.card},
                  ]}>
                  <View style={{paddingVertical: 4}}>
                    <TouchableOpacity
                      onPress={() => {
                        isHeaderMenuDismissingRef.current = true;
                        pendingActionRef.current = () => {
                          isHeaderMenuDismissingRef.current = false;
                          setRenameModalVisible(true);
                        };
                        setShowHeaderMenu(false);
                      }}
                      style={{paddingHorizontal: 16, paddingVertical: 12}}>
                      <Text
                        style={[
                          styles.menuItemTitle,
                          {color: colors.textPrimary},
                        ]}>
                        Rename
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        isHeaderMenuDismissingRef.current = true;
                        pendingActionRef.current = () => {
                          confirmDeleteThisList();
                          isHeaderMenuDismissingRef.current = false;
                        };
                        setShowHeaderMenu(false);
                      }}
                      style={{paddingHorizontal: 16, paddingVertical: 12}}>
                      <Text style={styles.menuItemTitleDelete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Popover>
              </View>
            ) : null
          }
        />

        {/* Progress Bar — always visible above the tab bar */}
        <View style={[styles.progressContainer, {paddingHorizontal: 20}]}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, {color: colors.textSecondary}]}>
              {purchasedItems}/{totalItems} completed
            </Text>
            <Text style={[styles.progressPercentText, {color: colors.primary}]}>
              {Math.round(progressPercent)}%
            </Text>
          </View>
          <View style={[styles.track, {backgroundColor: colors.progressTrack}]}>
            <View
              style={[
                styles.fill,
                {width: `${progressPercent}%`, backgroundColor: colors.primary},
              ]}
            />
          </View>
        </View>

        {/* ── Top-level Items / Messages tab bar ── */}
        <View style={[styles.mainTabBar, {borderBottomColor: colors.divider}]}>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === "Items" && [
                styles.mainTabActive,
                {borderBottomColor: colors.textPrimary},
              ],
            ]}
            onPress={() => setMainTab("Items")}>
            <Text
              style={[
                styles.mainTabText,
                {
                  color:
                    mainTab === "Items" ? colors.textPrimary : colors.textMuted,
                },
                mainTab === "Items" && styles.mainTabTextActive,
              ]}>
              Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.mainTab,
              mainTab === "Messages" && [
                styles.mainTabActive,
                {borderBottomColor: colors.textPrimary},
              ],
            ]}
            onPress={() => setMainTab("Messages")}>
            <Text
              style={[
                styles.mainTabText,
                {
                  color:
                    mainTab === "Messages"
                      ? colors.textPrimary
                      : colors.textMuted,
                },
                mainTab === "Messages" && styles.mainTabTextActive,
              ]}>
              Messages ({messages.length})
            </Text>
          </TouchableOpacity>
        </View>

        {mainTab === "Items" ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Add Item Input — disabled for viewers */}
            <View
              style={[
                styles.inputContainer,
                {borderColor: colors.border, backgroundColor: colors.card},
                isViewer && {opacity: 0.5},
              ]}>
              <TextInput
                style={[styles.input, {color: colors.textPrimary}]}
                placeholder={
                  isViewer ? "You have view-only access" : "Add an item..."
                }
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
                  {backgroundColor: colors.backgroundSecondary},
                  (!newItemText.trim() || isViewer) && styles.addButtonDisabled,
                ]}
                onPress={handleAddItem}
                disabled={
                  isViewer ||
                  !newItemText.trim() ||
                  isActionPending(`add-${listId}`)
                }>
                <Plus
                  size={20}
                  color={
                    !isViewer && newItemText.trim()
                      ? colors.primary
                      : colors.iconMuted
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Sub-Tabs: All Items / To Do / Completed */}
            <View
              style={[
                styles.tabsContainer,
                {borderBottomColor: colors.divider},
              ]}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "All Items" && [
                    styles.activeTab,
                    {borderBottomColor: colors.textPrimary},
                  ],
                ]}
                onPress={() => setActiveTab("All Items")}>
                <Text
                  style={[
                    styles.tabText,
                    {color: colors.textMuted},
                    activeTab === "All Items" && [
                      styles.activeTabText,
                      {color: colors.textPrimary},
                    ],
                  ]}>
                  All Items ({allItems})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "To Do" && [
                    styles.activeTab,
                    {borderBottomColor: colors.textPrimary},
                  ],
                ]}
                onPress={() => setActiveTab("To Do")}>
                <Text
                  style={[
                    styles.tabText,
                    {color: colors.textMuted},
                    activeTab === "To Do" && [
                      styles.activeTabText,
                      {color: colors.textPrimary},
                    ],
                  ]}>
                  To Do ({pendingItems.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "Completed" && [
                    styles.activeTab,
                    {borderBottomColor: colors.textPrimary},
                  ],
                ]}
                onPress={() => setActiveTab("Completed")}>
                <Text
                  style={[
                    styles.tabText,
                    {color: colors.textMuted},
                    activeTab === "Completed" && [
                      styles.activeTabText,
                      {color: colors.textPrimary},
                    ],
                  ]}>
                  Completed ({doneItems.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Item List */}
            <View style={styles.listContainer}>
              {activeTab === "To Do" ? (
                displayItems.length > 0 ? (
                  <FlatList
                    data={displayItems}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.id || item._id)}
                    scrollEnabled={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                  />
                ) : (
                  <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                    All caught up! Nothing to do.
                  </Text>
                )
              ) : activeTab === "Completed" ? (
                doneItems.length > 0 ? (
                  <FlatList
                    data={doneItems}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.id || item._id)}
                    scrollEnabled={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                  />
                ) : (
                  <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                    No completed items yet.
                  </Text>
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
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                    />
                  ) : null}

                  {/* Completed items */}
                  {doneItems.length > 0 ? (
                    <>
                      <View
                        style={[
                          styles.sectionHeader,
                          {backgroundColor: colors.backgroundSecondary},
                        ]}>
                        <Text
                          style={[
                            styles.sectionTitle,
                            {color: colors.textMuted},
                          ]}>
                          COMPLETED
                        </Text>
                      </View>
                      <FlatList
                        data={doneItems}
                        renderItem={renderItem}
                        keyExtractor={item => String(item.id || item._id)}
                        scrollEnabled={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                      />
                    </>
                  ) : null}

                  {/* Empty state when there are no items at all */}
                  {displayItems.length === 0 && doneItems.length === 0 ? (
                    <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                      No items in this list.
                    </Text>
                  ) : null}
                </>
              )}
            </View>

            <View style={{height: 100}} />
          </ScrollView>
        ) : (
          /* ── Messages Tab ── */
          <KeyboardAvoidingView
            style={styles.messagesContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}>
            {/* Messages list */}
            <FlatList
              ref={flatListRef}
              data={messages}
              onContentSizeChange={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({animated: true});
                }, 200);
              }}
              onLayout={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({animated: false});
                }, 200);
              }}
              keyExtractor={item => item._id || item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyMessagesContainer}>
                  <Text
                    style={[
                      styles.emptyMessagesText,
                      {color: colors.textMuted},
                    ]}>
                    No messages yet. Be the first to say hi! 👋
                  </Text>
                </View>
              )}
              renderItem={renderMessageItem}
              ListFooterComponent={<View style={{height: 10}} />}
            />

            {/* Bottom input bar */}
            <View
              style={[
                styles.msgInputBar,
                {
                  backgroundColor: colors.background,
                  borderTopColor: colors.divider,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
                },
              ]}>
              <View
                style={[
                  styles.msgInputWrap,
                  {backgroundColor: colors.backgroundSecondary},
                ]}>
                <TextInput
                  style={[styles.msgInput, {color: colors.textPrimary}]}
                  placeholder={t("common_type_comment") || "Type a comment..."}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={messageText}
                  onChangeText={setMessageText}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
              </View>
              <TouchableOpacity
                style={styles.sendBtn}
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}>
                <Image source={Images.sendBtn} style={styles.sendBtnImg} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>

      <ItemPriorityModal
        isVisible={priorityModal.visible}
        currentPriority={priorityModal.current}
        onClose={() => setPriorityModal(prev => ({...prev, visible: false}))}
        onSave={newPriority => handleSetPriority(newPriority)}
      />
      <SelectionModal
        isVisible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        onSave={handleRenameList}
        type="input"
        title="Rename List"
        initialValue={list?.name}
        confirmLabel="Rename"
        cancelLabel="Cancel"
      />
      <SelectionModal
        isVisible={renameItemModal.visible}
        onClose={() => setRenameItemModal(prev => ({...prev, visible: false}))}
        onSave={handleRenameItem}
        type="input"
        title="Rename Item"
        initialValue={renameItemModal.currentName}
        confirmLabel="Rename"
        cancelLabel="Cancel"
      />
    </>
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
    paddingTop: 16,
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
    fontFamily: FontFamily.medium,
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
  priorityTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityTagText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  // ── Message styles ────────────────────────────────────────────
  mainTabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    gap: 24,
  },
  mainTab: {
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  mainTabActive: {},
  mainTabText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  mainTabTextActive: {
    fontFamily: FontFamily.semiBold || FontFamily.bold,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyMessagesText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    textAlign: "center",
    lineHeight: 20,
  },
  // Other person's message
  otherMsgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  otherMsgBubble: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  otherMsgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  otherMsgName: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  otherMsgTime: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
  },
  otherMsgText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  // My message
  myMsgRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 12,
    marginBottom: 12,
  },
  myMsgBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: "75%",
  },
  myMsgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 16,
  },
  myMsgName: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    // color is applied dynamically via colors.msgMyName
  },
  myMsgTime: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    // color is applied dynamically via colors.msgTimestamp
  },
  myMsgText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    // color is applied dynamically via colors.msgMyText
    lineHeight: 18,
  },
  // Avatar
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // backgroundColor is applied dynamically via colors.primary
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarInitial: {
    // color is applied dynamically via colors.textInverse
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  // Bottom input bar
  msgInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  msgInputWrap: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  msgInput: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnImg: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  dateHeaderContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  dateHeaderText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
});

export default ListDetailsScreen;
