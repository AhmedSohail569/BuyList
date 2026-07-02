import React, {useState, useEffect, useCallback, useMemo, useRef} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView as RNScrollView,
} from "react-native";
import {
  Plus,
  Search,
  MoreHorizontal,
  Sparkles,
  Check,
  ListFilter,
  X,
} from "lucide-react-native";
import {useDispatch, useSelector} from "react-redux";
import {useFocusEffect} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Popover from "react-native-popover-view";
import {Modal, ScrollView, Text} from "~components/Common";
import Header from "~components/Header";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import useOnReconnect from "~hooks/useOnReconnect";
import {
  fetchAllLists,
  deleteList,
  createList,
  fetchArchivedLists,
  toggleArchiveList,
  duplicateList,
  shareListToCircle,
} from "~redux/actions/listActions";
import {fetchCirclesPicker} from "~redux/actions/circleActions";
import SelectionModal from "~containers/modals/SelectionModal";
import {clearListsError} from "~redux/reducers/listReducer";
import {useAlert} from "~context/AlertContext";
import {useTheme} from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";
import {hexToRgbStr} from "~utils";

// --- Sub Components ---

const FilterTab = ({label, count, isActive, onPress, colors, isDark}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.filterTab,
      {
        backgroundColor: isActive
          ? isDark
            ? colors.primary
            : "#111827"
          : colors.card,
        borderColor: isActive
          ? isDark
            ? colors.primary
            : "#111827"
          : colors.border,
      },
    ]}>
    <Text
      style={[
        styles.filterText,
        {color: isActive ? "#ffffff" : colors.textMuted},
      ]}>
      {label} ({count})
    </Text>
  </TouchableOpacity>
);

const ProgressBar = ({completed, total, color, label, percentage, colors}) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextRow}>
        <Text style={[styles.progressStats, {color: colors.textSecondary}]}>
          {label}
        </Text>
        <Text style={[styles.progressPercentage, {color: color}]}>
          {percentage}%
        </Text>
      </View>
      <View style={[styles.track, {backgroundColor: colors.progressTrack}]}>
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

// Memoized List Card Component
const ListCard = React.memo(
  ({
    item,
    onPress,
    isDeleting,
    isArchiving,
    isDuplicating,
    isArchived,
    menuVisible,
    onOpenMenu,
    onCloseMenu,
    onRequestDelete,
    onRequestArchive,
    onRequestDuplicate,
    onRequestShare,
    profile,
    t,
  }) => {
    const pendingActionRef = React.useRef(null);
    const {colors, isDark} = useTheme();
    const totalItems = item.progress?.total || 0;
    const completedItems = item.progress?.purchased || 0;
    const isCompleted = totalItems > 0 && completedItems === totalItems;
    console.log("ItemList", item);
    const progressColor =
      item.type === "personal"
        ? "#16A34A"
        : isCompleted
        ? "#22c55e"
        : "#0ea5e9";
    const stripColor = item.circle?.color || progressColor;

    const circleColor = item.circle?.color;
    const circleRgb = hexToRgbStr(circleColor);
    const badgeBg =
      circleColor && circleRgb
        ? `rgba(${circleRgb}, 0.15)`
        : isDark
        ? "rgba(14, 165, 233, 0.2)"
        : "#e0f2fe";
    const badgeTextColor = circleColor || colors.primary;
    const circleBadgeLabel = item.circle?.name || "Shared";

    return (
      <TouchableOpacity
        key={item.id || item._id}
        style={[
          styles.card,
          {backgroundColor: colors.card, shadowColor: colors.shadowColor},
        ]}
        onPress={onPress}
        disabled={isDeleting || isArchiving || isDuplicating}>
        <View style={[styles.cardBorderStrip, {backgroundColor: stripColor}]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
                {item.name}
              </Text>
              {item.type === "shared" && (
                <View style={[styles.sharedBadge, {backgroundColor: badgeBg}]}>
                  <Text style={[styles.sharedText, {color: badgeTextColor}]}>
                    {circleBadgeLabel}
                  </Text>
                </View>
              )}
            </View>
            {item.owner === profile._id && (
              <Popover
                isVisible={menuVisible}
                onRequestClose={onCloseMenu}
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
                      onOpenMenu();
                    }}
                    disabled={isDeleting || isArchiving || isDuplicating}>
                    <MoreHorizontal size={20} color={colors.iconMuted} />
                  </TouchableOpacity>
                )}
                popoverStyle={[
                  styles.menuContent,
                  {backgroundColor: colors.card},
                ]}>
                <View style={{paddingVertical: 4}}>
                  <TouchableOpacity
                    onPress={() => {
                      pendingActionRef.current = () => onRequestArchive();
                      onCloseMenu();
                    }}
                    style={{paddingHorizontal: 16, paddingVertical: 12}}>
                    <Text
                      style={[
                        styles.menuItemArchive,
                        {color: colors.textPrimary},
                      ]}>
                      {isArchived ? t("common_unarchive") : t("common_archive")}
                    </Text>
                  </TouchableOpacity>
                  {isArchived && (
                    <TouchableOpacity
                      onPress={() => {
                        pendingActionRef.current = () => onRequestDuplicate();
                        onCloseMenu();
                      }}
                      style={{paddingHorizontal: 16, paddingVertical: 12}}>
                      <Text
                        style={[
                          styles.menuItemArchive,
                          {color: colors.primary},
                        ]}>
                        {t("common_duplicate")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!isArchived && (
                    <TouchableOpacity
                      onPress={() => {
                        pendingActionRef.current = () => onRequestShare();
                        onCloseMenu();
                      }}
                      style={{paddingHorizontal: 16, paddingVertical: 12}}>
                      <Text
                        style={[
                          styles.menuItemArchive,
                          {color: colors.primary},
                        ]}>
                        {item.type === "shared" ? t("common_unshare") : t("common_share")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      pendingActionRef.current = () => onRequestDelete();
                      onCloseMenu();
                    }}
                    style={{paddingHorizontal: 16, paddingVertical: 12}}>
                    <Text style={styles.menuItemDelete}>
                      {t("common_delete")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Popover>
            )}
          </View>

          <Text style={[styles.subtitle, {color: colors.textMuted}]}>
            {item.category} • {formatDate(item.updatedAt || item.createdAt)}
          </Text>

          {item.priority && item.priority !== "none" && (
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor:
                    item.priority === "high"
                      ? isDark
                        ? "rgba(239, 68, 68, 0.2)"
                        : "#fee2e2"
                      : item.priority === "medium"
                      ? isDark
                        ? "rgba(234, 179, 8, 0.2)"
                        : "#fef9c3"
                      : isDark
                      ? "rgba(34, 197, 94, 0.2)"
                      : "#dcfce7",
                },
              ]}>
              <Text
                style={[
                  styles.priorityText,
                  {
                    color:
                      item.priority === "high"
                        ? "#ef4444"
                        : item.priority === "medium"
                        ? "#ca8a04"
                        : "#16a34a",
                  },
                ]}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </Text>
            </View>
          )}

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
              <View
                style={[
                  styles.completedBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(22, 163, 74, 0.2)"
                      : "#dcfce7",
                  },
                ]}>
                <Check size={12} color="#16a34a" style={{marginRight: 4}} />
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
      prevProps.item.progress?.purchased ===
        nextProps.item.progress?.purchased &&
      prevProps.item.progress?.total === nextProps.item.progress?.total &&
      prevProps.item.progress?.percentage ===
        nextProps.item.progress?.percentage &&
      prevProps.item.circle?.color === nextProps.item.circle?.color &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.isArchiving === nextProps.isArchiving &&
      prevProps.isDuplicating === nextProps.isDuplicating &&
      prevProps.isArchived === nextProps.isArchived &&
      prevProps.menuVisible === nextProps.menuVisible &&
      prevProps.onRequestShare === nextProps.onRequestShare
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

const ListsTab = ({onQuickAction, navigation, route}) => {
  const dispatch = useDispatch();
  const {profile} = useSelector(state => state.profile);
  const lists = useSelector(state => state.lists.lists);
  const archivedLists = useSelector(state => state.lists.archivedLists);
  const loading = useSelector(state => state.lists.loading);
  const error = useSelector(state => state.lists.error);
  const [filterVersion, setFilterVersion] = useState(0);
  const {showAlert, showError} = useAlert();
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();

  console.log(route);

  const [activeTab, setActiveTab] = useState("All Lists");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isCreateListVisible, setCreateListVisible] = useState(false);
  const [openedFromHome, setOpenedFromHome] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [activeMenuListId, setActiveMenuListId] = useState(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [sortOption, setSortOption] = useState("priority");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [archivingListId, setArchivingListId] = useState(null);
  const [duplicatingListId, setDuplicatingListId] = useState(null);

  // Share to circle state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharingListId, setSharingListId] = useState(null);
  const [isUnshareMode, setIsUnshareMode] = useState(false);
  const [sharingListCircleName, setSharingListCircleName] = useState("");
  const [isSharingList, setIsSharingList] = useState(false);
  const pickerCircles = useSelector(state => state.circles.pickerCircles);
  const pickerLoading = useSelector(state => state.circles.pickerLoading);

  const circleOptions = pickerCircles.map(c => ({
    label: c.name,
    value: c._id || c.id,
  }));

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "All Lists":
        return t("lists_tab_all");
      case "Personal Lists":
        return t("lists_tab_personal");
      case "Shared Lists":
        return t("lists_tab_shared");
      case "Archived Lists":
        return t("lists_tab_archived");
      default:
        return activeTab;
    }
  };
  const listCounts = useMemo(() => {
    const totalLists = lists || [];
    console.log("lists", lists);
    return {
      all: totalLists.length,
      personal: totalLists.filter(item => item.type === "personal").length,
      shared: totalLists.filter(item => item.type === "shared").length,
      archived: (archivedLists || []).length,
    };
  }, [lists, archivedLists]);

  const isDismissingRef = useRef(false);
  const isFetchingOnFocusRef = useRef(false);

  // Open create list modal when navigated from other tabs (e.g. Home "Create" quick action)
  useFocusEffect(
    useCallback(() => {
      const shouldOpen = route?.params?.openCreateListModal;
      if (shouldOpen && !isCreateListVisible) {
        setOpenedFromHome(true);
        setCreateListVisible(true);
      }
      if (shouldOpen) {
        // Clear the param so it doesn't re-open on every focus
        navigation.setParams?.({openCreateListModal: undefined});
      }
    }, [route?.params?.openCreateListModal, isCreateListVisible, navigation]),
  );

  const closeCreateListModal = useCallback(() => {
    setCreateListVisible(false);
    if (openedFromHome) {
      setOpenedFromHome(false);
      navigation.navigate("Home");
    }
  }, [openedFromHome, navigation]);

  // When navigating back from ListDetails after a rename, bump filterVersion so filteredData recomputes
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.listNameUpdated) {
        setFilterVersion(v => v + 1);
        navigation.setParams({listNameUpdated: undefined});
      }
    }, [route?.params?.listNameUpdated, navigation]),
  );

  // Fetch lists on mount and refresh when screen is focused to get latest data
  useFocusEffect(
    useCallback(() => {
      // Refresh when screen is focused to ensure we have latest data.
      // IMPORTANT: don't depend on `loading` here; it changes during fetch and can re-trigger this effect.
      if (isFetchingOnFocusRef.current) return;

      isFetchingOnFocusRef.current = true;
      Promise.all([
        dispatch(fetchAllLists()).unwrap(),
        dispatch(fetchArchivedLists()),
      ])
        .catch(() => {})
        .finally(() => {
          isFetchingOnFocusRef.current = false;
        });
    }, [dispatch]),
  );

  // Re-fetch lists when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchAllLists());
    dispatch(fetchArchivedLists());
  });

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
        navigation.setParams?.({filter: undefined});
      }
    }, [route?.params?.filter, navigation]),
  );

  // Handle API errors
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: t("lists_error_title"),
        text2: typeof error === "string" ? error : t("lists_error_desc"),
      });
      dispatch(clearListsError());
    }
  }, [error, dispatch]);

  // Sort lists based on selected sort option
  const sortLists = useCallback(
    listsToSort => {
      const sorted = [...listsToSort];

      switch (sortOption) {
        case "priority":
          // Sort by priority (High > Medium > Low)
          return sorted.sort((a, b) => {
            const PRIORITY_VALUE = {high: 3, medium: 2, low: 1};
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
    },
    [sortOption],
  );

  // Filter and sort lists based on active tab and sort option
  const filteredData = useMemo(() => {
    if (activeTab === "Archived Lists") {
      const source = archivedLists || [];
      if (searchQuery.trim() !== "") {
        const lowerQuery = searchQuery.toLowerCase();
        return sortLists(
          source.filter(item =>
            (item.name || "").toLowerCase().includes(lowerQuery),
          ),
        );
      }
      return sortLists(source);
    }

    let filtered = lists.filter(item => {
      if (activeTab === "Personal Lists") return item.type === "personal";
      if (activeTab === "Shared Lists") return item.type === "shared";
      return true;
    });

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.name || "").toLowerCase().includes(lowerQuery),
      );
    }

    return sortLists(filtered);
  }, [lists, archivedLists, activeTab, sortLists, searchQuery, filterVersion]);

  // Duplicate list handler (archived lists only)
  const handleDuplicateList = useCallback(
    async listId => {
      setDuplicatingListId(listId);
      try {
        await dispatch(duplicateList({listId})).unwrap();
        Toast.show({type: "success", text1: "List duplicated"});
        dispatch(fetchAllLists());
      } catch {
        // Error handled by useEffect
      } finally {
        setDuplicatingListId(null);
      }
    },
    [dispatch],
  );

  // Share list to circle handler (personal → shared)
  const handleShareList = useCallback(
    async circleId => {
      if (!sharingListId || !circleId) return;
      setIsSharingList(true);
      try {
        await dispatch(
          shareListToCircle({listId: sharingListId, circleId, type: "shared"}),
        ).unwrap();
        Toast.show({type: "success", text1: t("common_share_success")});
        setShareModalVisible(false);
        setSharingListId(null);
        await dispatch(fetchAllLists()).unwrap();
      } catch (err) {
        Toast.show({
          type: "error",
          text1: t("common_share_failed"),
          text2: typeof err === "string" ? err : t("common_something_went_wrong"),
        });
      } finally {
        setIsSharingList(false);
      }
    },
    [dispatch, sharingListId],
  );

  // Unshare list handler (shared → personal)
  const handleUnshareList = useCallback(
    async () => {
      if (!sharingListId) return;
      setIsSharingList(true);
      try {
        await dispatch(
          shareListToCircle({listId: sharingListId, type: "personal"}),
        ).unwrap();
        Toast.show({type: "success", text1: t("common_unshare_success")});
        setShareModalVisible(false);
        setSharingListId(null);
        await dispatch(fetchAllLists()).unwrap();
      } catch (err) {
        Toast.show({
          type: "error",
          text1: t("common_unshare_failed"),
          text2: typeof err === "string" ? err : t("common_something_went_wrong"),
        });
      } finally {
        setIsSharingList(false);
      }
    },
    [dispatch, sharingListId],
  );

  // Archive list handler
  const handleArchiveList = useCallback(
    async (listId, isCurrentlyArchived) => {
      setArchivingListId(listId);
      try {
        await dispatch(toggleArchiveList({listId})).unwrap();
        Toast.show({
          type: "success",
          text1: isCurrentlyArchived ? "List unarchived" : "List archived",
        });
        dispatch(fetchAllLists());
        dispatch(fetchArchivedLists());
      } catch {
        // Error handled by useEffect
      } finally {
        setArchivingListId(null);
      }
    },
    [dispatch],
  );

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAllLists()).unwrap(),
        dispatch(fetchArchivedLists()),
      ]);
    } catch {
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
        await dispatch(deleteList({listId})).unwrap();
        Toast.show({
          type: "success",
          text1: t("lists_delete_success_title"),
          text2: t("lists_delete_success_desc"),
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
        title: t("lists_delete_title"),
        message: `${t("lists_delete_message")} "${
          listName || t("lists_delete_this")
        }"?`,
        type: "confirm",
        buttons: [
          {text: t("common_cancel"), style: "cancel"},
          {
            text: t("common_delete"),
            style: "destructive",
            onPress: async () => {
              try {
                await handleDeleteList(listId);
              } catch (e) {
                showError(t("common_error"), t("lists_error_desc"));
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
          text1: t("lists_error_title"),
          text2: t("lists_validation_name"),
        });
        return;
      }

      if (!data.items || data.items.length === 0) {
        Toast.show({
          type: "error",
          text1: t("lists_error_title"),
          text2: t("lists_validation_items"),
        });
        return;
      }

      setIsCreatingList(true);

      try {
        await dispatch(createList(data)).unwrap();
        Toast.show({
          type: "success",
          text1: t("lists_create_success_title"),
          text2: t("lists_create_success_desc"),
        });
        closeCreateListModal();
        // Optimistic update already handled, no refetch needed
      } catch (err) {
        // Error handled by useEffect
      } finally {
        setIsCreatingList(false);
      }
    },
    [dispatch, isCreatingList, closeCreateListModal],
  );

  // Navigate to list details
  const handleListPress = useCallback(
    listId => {
      navigation.navigate("ListDetails", {listId});
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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        variant="title"
        title={t("lists_title")}
        rightAction={
          <TouchableOpacity
            style={[
              styles.searchButton,
              {backgroundColor: colors.card, shadowColor: colors.shadowColor},
            ]}
            onPress={() => {
              if (showSearchBar) {
                setSearchQuery("");
                setShowSearchBar(false);
              } else {
                setShowSearchBar(true);
              }
            }}>
            <Search size={RFValue(20)} color={colors.textPrimary} />
          </TouchableOpacity>
        }
        showTabs={
          <RNScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}>
            <FilterTab
              label={t("lists_tab_all")}
              count={listCounts.all}
              isActive={activeTab === "All Lists"}
              onPress={() => setActiveTab("All Lists")}
              colors={colors}
              isDark={isDark}
            />
            {listCounts.personal > 0 && (
              <FilterTab
                label={t("lists_tab_personal")}
                count={listCounts.personal}
                isActive={activeTab === "Personal Lists"}
                onPress={() => setActiveTab("Personal Lists")}
                colors={colors}
                isDark={isDark}
              />
            )}
            {listCounts.shared > 0 && (
              <FilterTab
                label={t("lists_tab_shared")}
                count={listCounts.shared}
                isActive={activeTab === "Shared Lists"}
                onPress={() => setActiveTab("Shared Lists")}
                colors={colors}
                isDark={isDark}
              />
            )}
            {listCounts.archived > 0 && (
              <FilterTab
                label={t("lists_tab_archived")}
                count={listCounts.archived}
                isActive={activeTab === "Archived Lists"}
                onPress={() => setActiveTab("Archived Lists")}
                colors={colors}
                isDark={isDark}
              />
            )}
          </RNScrollView>
        }
      />

      {showSearchBar && (
        <View
          style={[
            styles.searchBarWrapper,
            {backgroundColor: colors.background},
          ]}>
          <View
            style={[
              styles.searchBarContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Search size={RFValue(16)} color={colors.iconMuted} />
            <TextInput
              style={[styles.searchInput, {color: colors.textPrimary}]}
              placeholder={t("lists_search_placeholder")}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={RFValue(18)} color={colors.iconMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading && lists.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardVerticalOffset={0}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }>
          {/* Smart Suggestions */}
          {/* <View style={styles.smartSuggestionContainer}>
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
          </View> */}

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.textMuted}]}>
              {getActiveTabTitle().toUpperCase()}
            </Text>
            <Popover
              isVisible={showSortMenu}
              onRequestClose={() => {
                isDismissingRef.current = true;
                setShowSortMenu(false);
                setTimeout(() => {
                  isDismissingRef.current = false;
                }, 100);
              }}
              from={(sourceRef, showPopover) => (
                <TouchableOpacity
                  ref={sourceRef}
                  style={[
                    styles.sortButton,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => {
                    showPopover();
                    handleSortMenuToggle();
                  }}>
                  <ListFilter
                    size={14}
                    color={colors.iconMuted}
                    style={{marginRight: 4}}
                  />
                  <Text style={[styles.sortText, {color: colors.textMuted}]}>
                    Sort
                  </Text>
                </TouchableOpacity>
              )}
              popoverStyle={[
                styles.sortMenuContent,
                {backgroundColor: colors.card},
              ]}>
              <View style={{paddingVertical: 4}}>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("priority");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "priority"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Priority
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("createdOn");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "createdOn"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Created On
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("recentlyUpdated");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "recentlyUpdated"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Recently Updated
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("alphabetical");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "alphabetical"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Alphabetical A-Z
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("mostItems");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "mostItems"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Most Items
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    isDismissingRef.current = true;
                    setSortOption("leastItems");
                    setShowSortMenu(false);
                    setTimeout(() => {
                      isDismissingRef.current = false;
                    }, 100);
                  }}
                  style={{paddingHorizontal: 16, paddingVertical: 12}}>
                  <Text
                    style={[
                      styles.sortMenuItem,
                      {
                        color:
                          sortOption === "leastItems"
                            ? colors.primary
                            : colors.textPrimary,
                      },
                    ]}>
                    Least Items
                  </Text>
                </TouchableOpacity>
              </View>
            </Popover>
          </View>
          {/* Lists Cards */}
          <View style={styles.cardsContainer}>
            {filteredData.map(item => (
              <ListCard
                key={item.id || item._id}
                item={item}
                onPress={() => handleListPress(item.id || item._id)}
                isDeleting={deletingListId === (item.id || item._id)}
                isArchiving={archivingListId === (item.id || item._id)}
                isDuplicating={duplicatingListId === (item.id || item._id)}
                isArchived={activeTab === "Archived Lists"}
                menuVisible={activeMenuListId === (item.id || item._id)}
                onOpenMenu={() => setActiveMenuListId(item.id || item._id)}
                onCloseMenu={() => setActiveMenuListId(null)}
                onRequestDelete={() =>
                  confirmDeleteList(item.id || item._id, item.name)
                }
                onRequestArchive={() =>
                  handleArchiveList(
                    item.id || item._id,
                    activeTab === "Archived Lists",
                  )
                }
                onRequestDuplicate={() =>
                  handleDuplicateList(item.id || item._id)
                }
                onRequestShare={() => {
                  setSharingListId(item.id || item._id);
                  const isShared = item.type === "shared";
                  setIsUnshareMode(isShared);
                  setSharingListCircleName(item.circle?.name || "this circle");
                  if (!isShared) {
                    dispatch(fetchCirclesPicker());
                  }
                  setShareModalVisible(true);
                }}
                profile={profile}
                t={t}
              />
            ))}

            {filteredData.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                  No lists found in this category.
                </Text>
              </View>
            )}
          </View>

          <View style={{height: 80}} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {backgroundColor: colors.primary, shadowColor: colors.primary},
        ]}
        onPress={() => setCreateListVisible(true)}>
        <Plus size={32} color="#fff" />
      </TouchableOpacity>

      <Modal
        isVisible={isCreateListVisible}
        onClose={closeCreateListModal}
        onApply={handleCreateList}
        type="createList"
        loading={isCreatingList}
      />

      {/* Share / Unshare Circle Modal */}
      <SelectionModal
        isVisible={shareModalVisible}
        onClose={() => {
          setShareModalVisible(false);
          setSharingListId(null);
          setIsUnshareMode(false);
        }}
        onSave={isUnshareMode ? handleUnshareList : handleShareList}
        title={isUnshareMode ? t("common_unshared_list") : t("common_select_circle")}
        type={isUnshareMode ? "confirmation" : "selection"}
        description={
          isUnshareMode
            ? t("common_unshare_confirm").replace("{{circleName}}", sharingListCircleName)
            : ""
        }
        options={isUnshareMode ? [] : circleOptions}
        initialValue={isUnshareMode ? undefined : circleOptions[0]?.value}
        confirmLabel={
          isSharingList
            ? isUnshareMode
              ? t("common_unsharing")
              : t("common_sharing")
            : isUnshareMode
            ? t("common_unshare")
            : t("common_share")
        }
        cancelLabel={t("common_cancel")}
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
    shadowOffset: {width: 0, height: 2},
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
    paddingVertical: 5,
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
    gap: 4,
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
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  priorityText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
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
  menuItemArchive: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: RFValue(40),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    paddingVertical: 0,
  },
});

export default ListsTab;
