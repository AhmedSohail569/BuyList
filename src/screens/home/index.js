import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView as ReactScrollView,
  Dimensions,
} from "react-native";
import {
  Plus,
  List,
  Users,
  TrendingDown,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react-native";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import { ScrollView } from "~components/Common";
import NearbyStores from "~containers/sections/NearbyStores";
import YourLists from "~containers/sections/YourLists";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useSelector, useDispatch } from "react-redux";
import { fetchRecentActivities, fetchAllLists } from "~redux/actions/listActions";
// import { fetchPersonalizedRecommendations } from "~redux/actions/recommendationsActions";
import { getProfile } from "~redux/actions/profileActions";
import { fetchNotifications } from "~redux/actions/notificationActions";
import { useTheme } from "~context/ThemeContext";
import AdsOffersCarousel from "~components/AdsOffersCarousel";
import NotificationsDropdown from "~components/NotificationsDropdown";
import useOnReconnect from "~hooks/useOnReconnect";
import { fetchBanners, searchLocalStores } from "~redux/actions/searchActions";
import useScreenFetch from "~hooks/useScreenFetch";
import Avatar from "~components/Avatar";
import { normalizeActivity } from "~utils/display";
import useTranslation from "~hooks/useTranslation";

const { width } = Dimensions.get("window");

const BEST_PRICES = [
  {
    id: 1,
    name: "AirPods Pro",
    store: "Amazon",
    price: "$199",
    image:
      "https://images.unsplash.com/photo-1603351154351-5cfb3e19ef0f?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 2,
    name: "Sony XM5",
    store: "BestBuy",
    price: "$298",
    image:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=100&q=80",
  },
];


const HomeTab = ({ onQuickAction, navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { colors, isDark } = useTheme();
  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.profile);
  const { recentActivities } = useSelector(state => state.lists);
  const { homeBanners, localResults } = useSelector((state) => state.search);
  const { latitude, longitude } = useSelector((state) => state.location);
  const { homeItems: forYouItems, loading: recsLoading } = useSelector(
    (state) => state.recommendations,
  );

  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);


 

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim().length >= 3) {
      navigation.navigate("SearchResults", {
        query: searchQuery.trim(),
      });
      // Optional: Clear search after navigating
      setSearchQuery("");
    }
  };

  const handleMicPress = () => {
    navigation.navigate("SearchResults", {
      query: "",
    });
  };

  // Home data: profile + recent activities + lists — refresh silently on return
  const fetchHomeData = useCallback(async () => {
    const promises = [
      dispatch(getProfile()),
      dispatch(fetchRecentActivities()),
      dispatch(fetchAllLists()),
      dispatch(fetchNotifications()),
      // dispatch(fetchPersonalizedRecommendations({ page: 1, limit: 2 })),
    ];

    if (latitude && longitude) {
      promises.push(
        dispatch(
          searchLocalStores({
            query: "store",
            lat: latitude,
            lng: longitude,
            limit: 5,
            silent: true
          })
        )
      );
    }

    await Promise.all(promises);
  }, [dispatch, latitude, longitude, localResults.length]);
  useScreenFetch(fetchHomeData, true); // always quiet — home already shows stale data fine

  // Banners: fetch once, background-refresh on return
  // const fetchHomeBanners = useCallback(
  //   () => dispatch(fetchBanners({ placement: "home" })),
  //   [dispatch],
  // );
  // useScreenFetch(fetchHomeBanners, homeBanners.length > 0);

  // Re-fetch everything on reconnect
  useOnReconnect(() => {
    dispatch(getProfile());
    dispatch(fetchRecentActivities());
    dispatch(fetchAllLists());
    // dispatch(fetchBanners({ placement: "home" }));
  });

  // Normalize activities for display (limit to 2 for home screen)
  const circleUpdates = useMemo(() => {
    const activities = Array.isArray(recentActivities) ? recentActivities : [];
    return activities.slice(0, 2).map((activity, index) => normalizeActivity(activity, index, t));
  }, [recentActivities, t]);

  const navigateToTab = tabName => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate(tabName);
      return true;
    }
    navigation.navigate(tabName);
    return true;
  };

  const navigateToListsAndOpenCreate = () => {
    const tabNav = navigation.getParent?.();
    if (tabNav?.navigate) {
      tabNav.navigate("Lists", {
        screen: "ListsTab",
        params: { openCreateListModal: true },
      });
      return;
    }
    navigation.navigate("Lists", {
      screen: "ListsTab",
      params: { openCreateListModal: true },
    });
  };

  // Quick action colors for dark/light mode
  const quickActionColors = {
    create: { bg: isDark ? "rgba(37, 99, 235, 0.2)" : "#DBEAFE", icon: "#2563EB" },
    lists: { bg: isDark ? "rgba(147, 51, 234, 0.2)" : "#F3E8FF", icon: "#9333EA" },
    circle: {
      bg: isDark ? "rgba(234, 88, 12, 0.2)" : "#FFEDD5",
      icon: "#EA580C",
    },
    compare: {
      bg: isDark ? "rgba(22, 163, 74, 0.2)" : "#DCFCE7",
      icon: "#16A34A",
    },
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="home"
        greeting={t("home_good_morning")}
        userName={profile?.username || user?.username || "User"}
        avatar={profile?.profilePicture ? { uri: profile.profilePicture } : null}
        rightIcon="notifications-outline"
        notificationBadge={profile?.hasUnreadNotifications || user?.hasUnreadNotifications}
        onRightPress={() => setShowNotifications(true)}
      />

      <SearchBar
        placeholder={t("home_search_placeholder")}
        value={searchQuery}
        onChangeText={setSearchQuery}
        showSearchButton={true}
        onMicPress={handleMicPress}
        onSubmitEditing={handleSearch}
      />

      <ScrollView>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionIcon
            id="create"
            icon={Plus}
            label={t("home_quick_create")}
            color={quickActionColors.create.bg}
            iconColor={quickActionColors.create.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToListsAndOpenCreate()}  
          />
          <ActionIcon
            id="lists"
            icon={List}
            label={t("home_quick_lists")}
            color={quickActionColors.lists.bg}
            iconColor={quickActionColors.lists.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToTab("Lists")}
          />
          <ActionIcon
            id="circle"
            icon={Users}
            label={t("home_quick_circle")}
            color={quickActionColors.circle.bg}
            iconColor={quickActionColors.circle.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToTab("Circle")}
          />
          <ActionIcon
            id="search"
            icon={Search}
            label={t("home_quick_search")}
            color={quickActionColors.compare.bg}
            iconColor={quickActionColors.compare.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToTab("Search")}
          />
        </View>


        <YourLists navigation={navigation} />

          {/* --- SECTION: Circle Updates --- */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("home_circle_updates")}
        </Text>
        <View
          style={[
            styles.updatesCard,
            {
              backgroundColor: colors.card,
              shadowColor: colors.shadowColor,
            },
          ]}>
          {circleUpdates.length === 0 ? (
            <Text style={[styles.emptyUpdateText, { color: colors.textMuted }]}>
              {t("home_no_updates")}
            </Text>
          ) : (
            circleUpdates.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.updateRow,
                  index !== 0 && [
                    styles.updateSeparator,
                    { borderTopColor: colors.divider },
                  ],
                ]}>
                <View>
                  <Avatar
                    image={item.userAvatar}
                    name={item.userName}
                    size={40}
                    colors={colors}
                  />
                  <View
                    style={[styles.onlineDot, { borderColor: colors.card }]}
                  />
                </View>
                <View style={styles.updateContent}>
                  <Text
                    style={[styles.updateText, { color: colors.textSecondary }]}>
                    <Text
                      style={[styles.boldText, { color: colors.textPrimary }]}>
                      {item.userName}
                    </Text>{" "}
                    {item.actionText}
                    {item.targetText ? ` in ${item.targetText}` : ""}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {item.timeText}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>


        {localResults.length !== 0 && <View style={{ left: RFValue(-16), width: width }}><NearbyStores navigation={navigation} /></View>}

        {/* {homeBanners && homeBanners.length > 0 && (
                <View style={{ left: RFValue(-16), width: width }}>
                    <AdsOffersCarousel
                      data={homeBanners.map(b => ({
                        id: b._id,
                        title: b.title,
                        subtitle: b.description,
                        image: b.imageUrl,
                        url: b.link,
                      }))}
                      title={t("home_ads_offers")}
                      onAdPress={(item) => {
                        if (item.url) {
                          // Assuming you have Linking imported. If not we should just pass
                        }
                      }}
                      autoPlay={true}
                    />
                  </View>
                )} */}


      

        {/* --- SECTION: Best Online Prices --- */}
        {/* <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("home_best_prices")}
        </Text>
        <View style={styles.horizontalScrollContainer}>
          <ReactScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BEST_PRICES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.priceCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {}}>
                <Image
                  source={{ uri: item.image }}
                  style={[
                    styles.priceImage,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                />
                <View style={styles.priceInfo}>
                  <Text style={[styles.priceName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.storeName, { color: colors.textMuted }]}>
                    {item.store}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>
                    {item.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ReactScrollView>
        </View> */}

        {/* --- SECTION: For You --- */}
        {/* <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                { marginBottom: 0, color: colors.textPrimary },
              ]}>
              {t("home_for_you")}
            </Text>
            <Sparkles
              size={16}
              color={colors.primary}
              fill={colors.primary}
              style={{ marginLeft: 6 }}
            />
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation.navigate("AIRecommendations")}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {t("home_see_all")}
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.forYouContainer}>
          {recsLoading && forYouItems.length === 0 ? (
            // Loading skeleton — 2 placeholder cards
            [0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.forYouCard,
                  { backgroundColor: colors.card, shadowColor: colors.shadowColor, opacity: 0.5 },
                ]}
              />
            ))
          ) : (
            forYouItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.forYouCard,
                  { backgroundColor: colors.card, shadowColor: colors.shadowColor },
                ]}>
                <Image
                  source={{ uri: item.image }}
                  style={[
                    styles.forYouImage,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                />
                <View style={styles.forYouContent}>
                  <View style={styles.forYouTitleRow}>
                    <Text
                      style={[styles.forYouTitle, { color: colors.textPrimary }]}
                      numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.priceRange && (
                      <View
                        style={[
                          styles.tagBadge,
                          { backgroundColor: colors.surfaceSecondary },
                        ]}>
                        <Text style={[styles.tagText, { color: colors.textMuted }]}>
                          {item.priceRange}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.forYouDesc, { color: colors.primary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.addListBtn,
                      { backgroundColor: isDark ? colors.surface : "#111827" },
                    ]}>
                    <Text style={[styles.addListText, { color: isDark ? colors.primary : "#FFF" }]}>
                      {t("home_add_to_list")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View> */}

        {/* <View style={{ height: 100 }} /> */}
      </ScrollView>

      {/* Notification dropdown modal */}
      <NotificationsDropdown
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
};

const ActionIcon = ({ id, icon: Icon, label, color, iconColor, labelColor, onPress }) => (
  <TouchableOpacity style={styles.actionItem} onPress={() => onPress(id)}>
    <View style={[styles.actionIconCircle, { backgroundColor: color }]}>
      <Icon size={24} color={iconColor} />
    </View>
    <Text style={[styles.actionLabel, { color: labelColor }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  actionItem: { alignItems: "center" },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: "600" },

  // Dev Token Section
  tokenCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  tokenSectionTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginBottom: 10,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenLabel: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.regular,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  deepLinkInput: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  deepLinkHint: {
    fontSize: RFValue(7),
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },

  // Section Headers
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginRight: 4,
  },

  // Circle Updates
  updatesCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  updateSeparator: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    backgroundColor: "#22C55E",
  },
  updateContent: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  updateText: {
    fontSize: RFValue(10),
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  boldText: {
    fontFamily: FontFamily.bold,
  },
  timeText: {
    fontSize: RFValue(8),
    marginTop: 2,
  },
  emptyUpdateText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    textAlign: "center",
    paddingVertical: 20,
  },

  // Best Online Prices
  horizontalScrollContainer: {
    marginHorizontal: -16,
    marginBottom: 24,
  },
  priceCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
    width: width * 0.42,
    alignItems: "center",
    borderWidth: 1,
  },
  priceImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  priceInfo: {
    marginLeft: 10,
    flex: 1,
  },
  priceName: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  storeName: {
    fontSize: RFValue(9),
    marginBottom: 2,
  },
  priceValue: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },

  // For You
  forYouContainer: {
    gap: 16,
  },
  forYouCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  forYouImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  forYouContent: {
    flex: 1,
    marginLeft: 12,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: RFValue(7),
    fontFamily: FontFamily.medium,
  },
  forYouTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  forYouTitle: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  forYouDesc: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    fontStyle: "italic",
    lineHeight: 16,
    marginBottom: 8,
  },
  addListBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addListText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
});

export default HomeTab;
