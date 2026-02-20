import { useEffect, useMemo, useState } from "react";
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
import { fetchRecentActivities } from "~redux/actions/listActions";
import { getProfile } from "~redux/actions/profileActions";
import { useTheme } from "~context/ThemeContext";
import { AD_OFFERS_DATA } from "~constants";
import AdsOffersCarousel from "~components/AdsOffersCarousel";
import NotificationsDropdown from "~components/NotificationsDropdown";

const { width } = Dimensions.get("window");

// Helper to format relative time
const formatTimeAgo = dateString => {
  if (!dateString) return "Recently";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

// Format activity action type to readable text
const formatActivityAction = (action, metadata) => {
  const itemCount = metadata?.itemCount || 1;

  switch (action) {
    case "PURCHASE_ITEMS":
      return `marked ${itemCount} ${itemCount === 1 ? "item" : "items"} as purchased`;
    case "ADD_ITEMS":
      return `added ${itemCount} ${itemCount === 1 ? "item" : "items"}`;
    case "CREATE_LIST":
      return "created a list";
    case "DELETE_LIST":
      return "deleted a list";
    case "JOIN_CIRCLE":
      return "joined the circle";
    case "LEAVE_CIRCLE":
      return "left the circle";
    default:
      return "updated the circle";
  }
};

// Normalize activity for display
const normalizeActivity = (activity, index) => {
  const id = activity?._id || activity?.id || `${index}`;
  const actor = activity?.actor || {};
  const userName = actor?.username || "Someone";
  const userAvatar = actor?.profilePicture || actor?.avatar || "";
  const actionType = activity?.action || "";
  const metadata = activity?.metadata || {};
  const actionText = formatActivityAction(actionType, metadata);
  const listObj = activity?.list || {};
  const targetText = listObj?.name || metadata?.listName || "";
  const createdAt = activity?.createdAt || activity?.updatedAt;
  const timeText = createdAt ? formatTimeAgo(createdAt) : "";

  return {
    id,
    userName,
    userAvatar,
    actionText,
    targetText,
    timeText,
  };
};

// Helper to get initials from name
const getInitials = name => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Helper to check if profile picture is available
const hasProfilePicture = profilePicture => {
  return profilePicture && profilePicture.trim() !== "";
};

// Avatar Component with initials fallback
const Avatar = ({ image, name, size = 40, style, colors }) => {
  const hasImage = hasProfilePicture(image);
  const initials = getInitials(name || "User");

  if (hasImage) {
    return (
      <View
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}>
        <Image
          source={{ uri: image }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors?.badgeBackground || "#e0f2fe",
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}>
      <Text
        style={{
          fontSize: RFValue(size * 0.35),
          color: colors?.primary || "#0ea5e9",
        }}>
        {initials}
      </Text>
    </View>
  );
};

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

const FOR_YOU = [
  {
    id: 1,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 2,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
];

const HomeTab = ({ onQuickAction, navigation }) => {
  const dispatch = useDispatch();

  const { colors, isDark } = useTheme();
  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.profile);
  const { recentActivities } = useSelector(state => state.lists);

  const { latitude, longitude } = useSelector((state) => state.location);

  console.log("latitude=>", latitude);
  console.log("longitude=>", longitude);

  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);



  // Fetch recent activities on mount
  useEffect(() => {
    dispatch(getProfile());
    dispatch(fetchRecentActivities());
  }, [dispatch]);

  // Normalize activities for display (limit to 2 for home screen)
  const circleUpdates = useMemo(() => {
    const activities = Array.isArray(recentActivities) ? recentActivities : [];
    return activities.slice(0, 2).map(normalizeActivity);
  }, [recentActivities]);

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
        greeting="Good Morning,"
        userName={profile?.username || user?.username || "User"}
        avatar={profile?.profilePicture ? { uri: profile.profilePicture } : null}
        rightIcon="notifications-outline"
        notificationBadge
        onRightPress={() => setShowNotifications(true)}
      />

      <SearchBar placeholder="Search products, categories..." />

      <ScrollView>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionIcon
            id="create"
            icon={Plus}
            label="Create"
            color={quickActionColors.create.bg}
            iconColor={quickActionColors.create.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToListsAndOpenCreate()}
          />
          <ActionIcon
            id="lists"
            icon={List}
            label="Lists"
            color={quickActionColors.lists.bg}
            iconColor={quickActionColors.lists.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToTab("Lists")}
          />
          <ActionIcon
            id="circle"
            icon={Users}
            label="Circle"
            color={quickActionColors.circle.bg}
            iconColor={quickActionColors.circle.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigateToTab("Circle")}
          />
          <ActionIcon
            id="compare"
            icon={TrendingDown}
            label="Compare"
            color={quickActionColors.compare.bg}
            iconColor={quickActionColors.compare.icon}
            labelColor={colors.textSecondary}
            onPress={() => navigation.navigate("PriceCheck")}
          />
        </View>

        <NearbyStores navigation={navigation} />

        <AdsOffersCarousel data={AD_OFFERS_DATA} title="Ads & Offers" onAdPress={() => console.log("Ad pressed")} autoPlay={true} />

        <YourLists navigation={navigation} />

        {/* --- SECTION: Circle Updates --- */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Circle Updates
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
              No recent updates yet.
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

        {/* --- SECTION: Best Online Prices --- */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Best Online Prices
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
                onPress={() => navigation.navigate("PriceCheck")}>
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
        </View>

        {/* --- SECTION: For You --- */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                { marginBottom: 0, color: colors.textPrimary },
              ]}>
              For You
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
              See All
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.forYouContainer}>
          {FOR_YOU.map((item, index) => (
            <View
              key={index}
              style={[
                styles.forYouCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: colors.shadowColor,
                },
              ]}>
              <Image
                source={{ uri: item.image }}
                style={[
                  styles.forYouImage,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              />
              <View style={styles.forYouContent}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}>
                  <Text
                    style={[styles.forYouTitle, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>
                      {item.tag}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.forYouDesc, { color: colors.primary }]}>
                  {item.desc}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.addListBtn,
                    { backgroundColor: isDark ? colors.surface : "#111827" },
                  ]}>
                  <Text
                    style={[
                      styles.addListText,
                      { color: isDark ? colors.primary : "#FFF" },
                    ]}>
                    + Add to List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
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
  forYouTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
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
