import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  MapPin,
  Truck,
  Filter,
  ChevronDown,
  Star,
  Share,
  Clock,
  Sparkles,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import { Modal, ScrollView, Text, AddToListModal } from "~components/Common";
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import {
  searchLocalStores,
  searchOnlineStores,
  fetchBanners,
} from "~redux/actions/searchActions";
import { clearSearchResults } from "~redux/reducers/searchReducer";
import { setLocation, setPermissionGranted, dismissLocationPrompt } from "~redux/reducers/locationReducer";
import { calculateDistance, formatDistance } from "~utils";
import AdsOffersCarousel from "~components/AdsOffersCarousel";
import useTranslation from "~hooks/useTranslation";
import useLocation from "~hooks/useLocation";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { useAlert } from "~context/AlertContext";
import { addItemsToList } from "~redux/actions/listActions";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

const SearchResultsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showAlert } = useAlert();

  // Get initial query from route params (if navigated with a query)
  const initialQuery = route?.params?.query || "";

  const [activeTab, setActiveTab] = useState("Local Stores");
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // { name } for AddToListModal

  // Redux state
  const {
    onlineResults,
    onlineCount,
    onlineLoading,
    onlineLoadingMore,
    onlineError,
    onlineHasMore,
    localResults,
    localCount,
    localLoading,
    localLoadingMore,
    localError,
    localHasMore,
    searchBanners,
    bannersLoading,
  } = useSelector((state) => state.search);
  const { distanceUnit } = useSelector((state) => state.settings);
  const { latitude, longitude, permissionGranted, promptDismissed } = useSelector(
    (state) => state.location,
  );

  console.log("permissionGranted", permissionGranted);
  console.log("promptDismissed", promptDismissed);

  // Track if we've shown the prompt this component lifecycle (prevents double-show)
  const hasPromptedRef = useRef(false);
  // Keep a ref to the current search query so async callbacks always see the latest value
  const searchQueryRef = useRef("");

  // useLocation gives us detectLocation() which requests permission + acquires location
  const { detectLocation } = useLocation();

  /**
   * Check current permission status (read-only, no dialog).
   * Returns true if already granted, false otherwise.
   */
  const checkCurrentPermission = useCallback(async () => {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
    if (!permission) return false;
    try {
      const status = await check(permission);
      return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    } catch {
      return false;
    }
  }, []);

  /**
   * Show custom in-app location permission prompt.
   * "Allow" triggers the OS dialog via detectLocation().
   * "Not Now" dismisses and search continues without location.
   */
  const showLocationPrompt = useCallback(() => {
    showAlert({
      title: "Enable Location",
      message:
        "Allow BuyList to use your location to find nearby stores and show distances. You can skip this and still search normally.",
      type: "confirm",
      buttons: [
        {
          text: "Not Now",
          style: "cancel",
          onPress: () => dispatch(dismissLocationPrompt()),
        },
        {
          text: "Allow",
          onPress: async () => {
            const result = await detectLocation();
            if (result) {
              // 1. Persist location to Redux so the whole app has lat/lng
              dispatch(setLocation({
                latitude: result.latitude,
                longitude: result.longitude,
                city: result.city || "",
                area: result.area || "",
              }));
              dispatch(setPermissionGranted(true));

              // 2. Immediately re-run any pending search with the fresh coordinates.
              //    We cannot rely on the Redux state re-render here because the
              //    performSearch closure captured null lat/lng at prompt creation time.
              const currentQuery = searchQueryRef.current;
              if (currentQuery?.trim()) {
                dispatch(
                  searchLocalStores({
                    query: currentQuery,
                    lat: result.latitude,
                    lng: result.longitude,
                    page: 1,
                    limit: 10,
                  }),
                );
              }
            } else {
              // OS-level denial or blocked — detectLocation already handles UI
              dispatch(dismissLocationPrompt());
            }
          },
        },
      ],
    });
  }, [showAlert, dispatch, detectLocation]);

  /**
   * On mount: check location permission and prompt once if not granted.
   * Fires immediately when the screen is entered — does not require
   * the user to tap the search bar.
   */
  useEffect(() => {
    if (permissionGranted || hasPromptedRef.current) return;

    const checkAndPrompt = async () => {
      // Silent read-only check first — avoids showing prompt if already granted
      const alreadyGranted = await checkCurrentPermission();
      if (alreadyGranted) {
        dispatch(setPermissionGranted(true));
        return;
      }
      hasPromptedRef.current = true;
      showLocationPrompt();
    };

    checkAndPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce timer ref
  const debounceRef = useRef(null);

  // Derived state
  const isOnlineTab = activeTab === "Online Stores";
  const results = isOnlineTab ? onlineResults : localResults;
  const resultsCount = isOnlineTab ? onlineCount : localCount;
  const loading = isOnlineTab ? onlineLoading : localLoading;
  const loadingMore = isOnlineTab ? onlineLoadingMore : localLoadingMore;
  const error = isOnlineTab ? onlineError : localError;
  const hasMore = isOnlineTab ? onlineHasMore : localHasMore;

  /**
   * Perform search based on active tab
   */
  const performSearch = useCallback(
    (query, page = 1) => {
      if (!query?.trim()) return;

      if (activeTab === "Online Stores") {
        dispatch(searchOnlineStores({ query, page, limit: 10 }));
      } else {
        dispatch(
          searchLocalStores({
            query,
            lat: latitude,
            lng: longitude,
            page,
            limit: 10,
          }),
        );
      }
    },
    [activeTab, dispatch, latitude, longitude],
  );

  // Get current page from Redux
  const currentPage = useSelector((state) =>
    isOnlineTab ? state.search.onlinePage : state.search.localPage,
  );

  /**
   * Load more results (next page)
   */
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !searchQuery.trim()) return;
    performSearch(searchQuery, currentPage + 1);
  }, [loadingMore, hasMore, searchQuery, currentPage, performSearch]);
  /**
   * Trigger search when tab changes
   */
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /**
   * Debounced search on query change
   */
  useEffect(() => {
    // Keep ref in sync so async callbacks (e.g. Allow button) always read current query
    searchQueryRef.current = searchQuery;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 600);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  /**
   * Fetch banners on mount
   */
  useEffect(() => {
    if (searchBanners.length === 0) {
      dispatch(fetchBanners({ placement: "search" }));
    }
  }, [dispatch, searchBanners.length]);

  /** Add a search result item to a chosen list */
  const handleAddToList = useCallback(
    async (listId) => {
      if (!selectedItem || !listId) return;
      const name = selectedItem.name;
      setSelectedItem(null);
      try {
        await dispatch(addItemsToList({ listId, items: [{ name: `${searchQuery} From ${selectedItem?.name}` }] })).unwrap();
        Toast.show({ type: "success", text1: "Added", text2: `${searchQuery} from ${selectedItem?.name} added to your list` });
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Failed to add",
          text2: typeof err === "string" ? err : "Something went wrong",
        });
      }
    },
    [dispatch, selectedItem],
  );

  useEffect(() => {
    return () => dispatch(clearSearchResults());
  }, [dispatch]);

  /**
   * Handle product link press (online stores)
   */
  const handleProductPress = useCallback((url) => {
    if (url) {
      Linking.openURL(url).catch(() => { });
    }
  }, []);

  // ============================================
  // RENDER: Online Store Card
  // ============================================
  const renderOnlineCard = (item, index) => {
    const id = item.product_link || `online-${index}`;
    const price = item.price || "";
    const seller = item.seller || item.store || "";
    const rating = item.rating ?? null;
    const reviews = item.reviews ?? 0;

    return (
      <View
        key={id}
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.shadowColor },
        ]}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={[
                styles.productImage,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            />
          ) : (
            <View
              style={[
                styles.productImage,
                {
                  backgroundColor: colors.backgroundSecondary,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}>
              <Truck size={24} color={colors.iconSecondary} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.productTitle, { color: colors.textPrimary }]}
            numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.contentFooter}>
            <View style={styles.cardTextContainer}>
              <View style={styles.storeRow}>
                <Truck
                  size={12}
                  color={colors.iconSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.storeName, { color: colors.textSecondary }]}
                  numberOfLines={1}>
                  {seller}
                </Text>
                {rating != null && (
                  <View style={styles.ratingContainer}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text
                      style={[styles.ratingText, { color: colors.textMuted }]}>
                      {" "}
                      {rating} ({reviews.toLocaleString()})
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.price, { color: colors.primary }]}
                numberOfLines={1}>
                {price}
              </Text>
            </View>

            <View style={styles.actionsColumn}>
              <TouchableOpacity
                onPress={() => handleProductPress(item.product_link)}
                style={[
                  styles.shareButton,
                  { backgroundColor: colors.backgroundSecondary },
                ]}>
                <Share size={18} color={colors.iconSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: colors.textPrimary },
                ]}
                onPress={() => setSelectedItem({ name: item.title || item.product_link })}>
                <Plus size={20} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER: Local Store Card
  // ============================================
  const renderLocalCard = (item, index) => {
    const id = item.placeId || `local-${index}`;
    const rating = item.rating ?? null;
    const totalRatings = item.totalRatings ?? 0;
    const isOpen = item.isOpen;

    // Calculate distance if location data is available
    const storeLat = item.location?.lat;
    const storeLng = item.location?.lng;
    const distanceKm =
      latitude != null &&
        longitude != null &&
        storeLat != null &&
        storeLng != null
        ? calculateDistance(latitude, longitude, storeLat, storeLng)
        : null;
    const distanceText = distanceKm != null ? formatDistance(distanceKm, distanceUnit) : "";

    return (
      <View
        key={id}
        style={[
          styles.card,
          { backgroundColor: colors.card, shadowColor: colors.shadowColor },
        ]}>
        <View style={styles.imageContainer}>
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={[
                styles.productImage,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            />
          ) : (
            <View
              style={[
                styles.productImage,
                {
                  backgroundColor: colors.backgroundSecondary,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}>
              <MapPin size={24} color={colors.iconSecondary} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.productTitle, { color: colors.textPrimary }]}
            numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.contentFooter}>
            <View style={styles.cardTextContainer}>
              <View style={styles.storeRow}>
                <MapPin
                  size={12}
                  color={colors.iconSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.storeName, { color: colors.textSecondary }]}
                  numberOfLines={1}>
                  {item.address}
                </Text>
                {distanceText && (
                  <Text
                    style={[styles.distance, { color: colors.textSecondary }]}>
                    {" "}
                    · {distanceText}
                  </Text>
                )}
              </View>

              {rating != null && (
                <View style={[styles.storeRow, { marginTop: 2 }]}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text
                    style={[
                      styles.ratingText,
                      { color: colors.textMuted, marginLeft: 4 },
                    ]}>
                    {rating} ({totalRatings.toLocaleString()})
                  </Text>
                </View>
              )}

              {isOpen != null && (
                <View
                  style={[
                    styles.shippingTag,
                    {
                      backgroundColor: isOpen
                        ? colors.badgeBackground
                        : colors.errorLight,
                    },
                  ]}>
                  <Clock
                    size={10}
                    color={isOpen ? colors.success : colors.error}
                    style={{ marginRight: 2 }}
                  />
                  <Text
                    style={[
                      styles.shippingText,
                      {
                        color: isOpen ? colors.badgeText : colors.error,
                      },
                    ]}>
                    {isOpen ? t("search_open") : t("search_closed")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionsColumn}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  { backgroundColor: colors.textPrimary },
                ]}
                onPress={() => setSelectedItem({ name: item.name })}>
                <Plus size={20} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER: Result card dispatcher
  // ============================================
  const renderResultCard = (item, index) => {
    return isOnlineTab
      ? renderOnlineCard(item, index)
      : renderLocalCard(item, index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={t("search_results_title")}
        onBack={() => navigation.goBack()}
      />

      <SearchBar
        type={2}
        placeholder={t("search_placeholder")}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={() => performSearch(searchQuery)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(40, insets.bottom + 40) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {/* Tab Switcher */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Local Stores" && [
                styles.activeTabButton,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadowColor,
                },
              ],
            ]}
            onPress={() => setActiveTab("Local Stores")}>
            <MapPin
              size={16}
              color={
                activeTab === "Local Stores"
                  ? colors.textPrimary
                  : colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === "Local Stores" && { color: colors.textPrimary },
              ]}>
              {t("search_tab_local")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Online Stores" && [
                styles.activeTabButton,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadowColor,
                },
              ],
            ]}
            onPress={() => setActiveTab("Online Stores")}>
            <Truck
              size={16}
              color={
                activeTab === "Online Stores"
                  ? colors.textPrimary
                  : colors.textMuted
              }
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === "Online Stores" && { color: colors.textPrimary },
              ]}>
              {t("search_tab_online")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {resultsCount} {t("search_results_count")}
          </Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setFilterModalVisible(true)}>
              <Filter size={14} color={colors.textSecondary} />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: colors.textSecondary },
                ]}>
                {t("search_filters")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setFilterModalVisible(true)}>
              <Text
                style={[
                  styles.filterButtonText,
                  { color: colors.textSecondary },
                ]}>
                {t("search_sort")}
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.noResultsContainer}>
            <Text
              style={[styles.noResultsText, { color: colors.textPrimary }]}>
              {t("common_error")}
            </Text>
            <Text
              style={[styles.noResultsSubText, { color: colors.textSecondary }]}>
              {typeof error === "string" ? error : t("search_try_again")}
            </Text>
          </View>
        ) : results.length === 0 && searchQuery.trim() ? (
          <View style={styles.noResultsContainer}>
            <Text
              style={[styles.noResultsText, { color: colors.textPrimary }]}>
              {t("search_no_results")} "{searchQuery}"
            </Text>
            <Text
              style={[styles.noResultsSubText, { color: colors.textSecondary }]}>
              {t("search_no_results_desc")}
            </Text>
          </View>
        ) : !searchQuery.trim() ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsSubText, { color: colors.textSecondary }]}>
              {t("search_prompt")}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listContainer}>
              {results.map(renderResultCard)}
            </View>
            {hasMore && (
              <TouchableOpacity
                style={[
                  styles.loadMoreButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  loadingMore && styles.loadMoreButtonDisabled,
                ]}
                onPress={handleLoadMore}
                disabled={loadingMore}>
                {loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.loadMoreText,
                      { color: colors.textPrimary },
                    ]}>
                    {t("search_load_more")}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={[{ left: RFValue(-16), width: width }, results.length === 0 && {marginTop: RFPercentage(15) }]}>
          {searchBanners && searchBanners.length > 0 && (
            <AdsOffersCarousel
              data={searchBanners.map(b => ({
                id: b._id,
                title: b.title,
                subtitle: b.description,
                image: b.imageUrl,
                url: b.link,
              }))}
              title={t("home_ads_offers")}
              onAdPress={(item) => {
                if (item.url) {
                  Linking.openURL(item.url).catch(() => {});
                }
              }}
              autoPlay={true}
            />
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        isVisible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(data) => console.log("Filters Applied:", data)}
      />

      {/* Add to List Modal */}
      <AddToListModal
        isVisible={!!selectedItem}
        itemName={`${searchQuery} From ${selectedItem?.name}`}
        onClose={() => setSelectedItem(null)}
        onSelect={handleAddToList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: -6,
    left: -6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomRightRadius: 0,
  },
  purpleBadge: {
    backgroundColor: "#9333ea",
  },
  badgeText: {
    color: "#fff",
    fontSize: RFValue(8),
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  productTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeName: {
    fontSize: RFValue(9),
    marginRight: 6,
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: RFValue(9),
  },
  price: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  distance: {
    fontSize: RFValue(10),
    fontWeight: "500",
  },
  shippingTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  shippingText: {
    fontSize: RFValue(7),
    fontFamily: FontFamily.regular,
  },
  actionsColumn: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  contentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  loader: {
    marginTop: 50,
  },
  noResultsContainer: {
    marginTop: 50,
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 14,
  },
  loadMoreButton: {
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
  },
});

export default SearchResultsScreen;
