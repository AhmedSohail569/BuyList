import { useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView as ReactScrollView,
} from "react-native";
import {
  Settings,
  MapPin,
  Pencil,
  ShoppingBag,
  UserPlus,
  Share2,
  QrCode,
  ChevronRight,
} from "lucide-react-native";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import Header from "~components/Header";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { fetchOwnedCircle } from "~redux/actions/circleActions";
import { fetchRecentActivities, fetchAllLists } from "~redux/actions/listActions";
import { useTheme } from "~context/ThemeContext";

// Helper function to get initials from a name
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    // Single name - take first 2 letters
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple names - take first letter of first and last name
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Helper function to check if profile picture is available
const hasProfilePicture = (profilePicture) => {
  return profilePicture && profilePicture.trim() !== "";
};

// Helper function to format role for display
const formatRole = (role) => {
  if (!role) return "Member";
  // Capitalize first letter
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Build connections list from ownedCircle data
const buildConnections = (ownedCircle) => {
  if (!ownedCircle) return [];

  const connections = [];

  // Always add owner first
  if (ownedCircle.owner) {
    connections.push({
      id: ownedCircle.owner._id || ownedCircle.owner.id,
      name: ownedCircle.owner.username || ownedCircle.owner.email || "Owner",
      role: "Owner",
      image: ownedCircle.owner.profilePicture,
      isOwner: true,
    });
  }

  // Add members if they exist
  if (ownedCircle.members && Array.isArray(ownedCircle.members)) {
    ownedCircle.members.forEach((member) => {
      if (member.userId) {
        connections.push({
          id: member.userId._id || member.userId.id,
          name: member.userId.username || member.userId.email || "Member",
          role: formatRole(member.role),
          image: member.userId.profilePicture,
          isOwner: false,
        });
      }
    });
  }

  return connections;
};

// Helper function to format time ago for lists
const formatListTimeAgo = (isoDate) => {
  if (!isoDate) return "Updated recently";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Updated just now";
  if (mins < 60) return `Updated ${mins}m ago`;
  if (hours < 24) return `Updated ${hours}h ago`;
  if (days < 7) return `Updated ${days}d ago`;
  return `Updated ${Math.floor(days / 7)}w ago`;
};

// ---- Recent Activity Helpers (from /activities/recent) ----
const formatTimeAgo = isoDate => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
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

const normalizeActivity = (activity, index) => {
  const id = activity?._id || activity?.id || `${index}`;

  // Extract actor info (new API format uses `actor` object)
  const actor = activity?.actor || {};
  const userName = actor?.username || activity?.username || "Someone";
  const userAvatar = actor?.profilePicture || actor?.avatar || "";

  // Extract action and format it
  const actionType = activity?.action || "";
  const metadata = activity?.metadata || {};
  const actionText = formatActivityAction(actionType, metadata);

  // Extract target/list name
  const listObj = activity?.list || {};
  const targetText = listObj?.name || metadata?.listName || "";

  // Format timestamp
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

// --- Sub Components ---

// Avatar Component with initials fallback
const Avatar = ({ image, name, size = 56, style, colors }) => {
  const hasImage = hasProfilePicture(image);
  const initials = getInitials(name || "User");

  if (hasImage) {
    return (
      <Image
        source={{ uri: image }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
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
          fontSize: RFValue(size * 0.30),
          color: colors?.primary || "#0ea5e9",
        }}>
        {initials}
      </Text>
    </View>
  );
};

// Avatar Stack Component
const AvatarStack = ({ items, size = 24, limit = 3, colors }) => {
  // items can be array of {image, name} objects or array of image strings (for backward compatibility)
  const avatarItems = items.map((item, index) => {
    if (typeof item === "string") {
      // Backward compatibility: if it's a string, treat as image
      return { image: item, name: "User" };
    }
    return item;
  });

  return (
    <View style={styles.avatarStack}>
      {avatarItems.slice(0, limit).map((item, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -8,
            zIndex: limit - index,
          }}>
          <Avatar
            image={item.image}
            name={item.name}
            size={size}
            style={[styles.stackAvatar, { borderColor: colors?.card || "#fff" }]}
            colors={colors}
          />
        </View>
      ))}
    </View>
  );
};

const ProgressBar = ({ percentage, colors, isDark }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.track, { backgroundColor: colors?.progressTrack || "#f3f4f6" }]}>
      <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: colors?.primary || "#0ea5e9" }]} />
    </View>
    <Text style={[styles.progressText, { color: colors?.primary || "#0ea5e9" }]}>{percentage}%</Text>
  </View>
);

const CircleTab = ({ navigation }) => {
  const dispatch = useDispatch();
  const { colors, isDark } = useTheme();
  const { ownedCircle } = useSelector(state => state.circles);
  const { recentActivities, lists } = useSelector(state => state.lists);

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchOwnedCircle());
      dispatch(fetchRecentActivities());
      dispatch(fetchAllLists());
    }, [dispatch])
  );

  // Build connections from ownedCircle data
  const connections = buildConnections(ownedCircle);

  // Get circle name or default
  const circleName = ownedCircle?.name || "Family Home";
  const homeLocation = ownedCircle?.owner?.zone || "Set your home location";
  const activityItems = useMemo(() => {
    const source = Array.isArray(recentActivities) ? recentActivities : [];
    return source.slice(0, 5).map(normalizeActivity);
  }, [recentActivities]);

  // Filter and format shared lists
  const sharedLists = useMemo(() => {
    const PRIORITY_VALUE = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const getPriorityValue = (p) => PRIORITY_VALUE[p?.toLowerCase()] || 0;

    const filtered = lists
      .filter(list => list.type === "shared")
      .sort((a, b) => {
        // Primary sort: Priority (descending)
        const pA = getPriorityValue(a.priority);
        const pB = getPriorityValue(b.priority);
        if (pA !== pB) return pB - pA;

        // Secondary sort: Most recently updated (descending)
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

    return filtered.slice(0, 3).map(list => {
      const progress = list.progress || { total: 0, purchased: 0, percentage: 0 };

      // Get member avatars if available
      const members = list.shareWithCircle?.members || [];
      const avatars = members
        .slice(0, 2)
        .map(member => member?.userId?.profilePicture || member?.profilePicture)
        .filter(Boolean);

      return {
        id: list.id || list._id,
        title: list.name || "Untitled List",
        progress: progress.percentage,
        updated: formatListTimeAgo(list.updatedAt || list.createdAt),
        avatars: avatars.length > 0 ? avatars : [null, null], // Show initials if no avatars
      };
    });
  }, [lists]);

  const handleListPress = useCallback((listId) => {
    navigation.navigate("ListDetails", { listId });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="title"
        title={"Your Circle"}
        subtitle={"Shared shopping with your household"}
        rightAction={
          <TouchableOpacity style={[styles.addUserButton, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
            <UserPlus size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />


      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Family Home Card */}
        <View style={[styles.familyCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          {/* Decorative Corner */}
          <View style={[styles.decorativeCorner, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.1)" : "#f0f9ff" }]} />

          <View style={styles.familyHeaderRow}>
            <View style={[styles.iconBg, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe" }]}>
              <ShoppingBag size={20} color={colors.primary} />
            </View>
            <View style={styles.familyTitleContainer}>
              <Text style={[styles.familyTitle, { color: colors.textPrimary }]}>{circleName}</Text>
              <View style={[styles.ownerBadge, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.15)" : "#eff6ff", borderColor: isDark ? "rgba(14, 165, 233, 0.3)" : "#dbeafe" }]}>
                <Text style={[styles.ownerText, { color: colors.primary }]}>Owner</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsIcon}
              onPress={() => navigation.navigate("CircleSettings")}>
              <Settings size={20} color={colors.iconMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.addressRow, { backgroundColor: colors.surfaceSecondary }]}>
            <MapPin size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.addressText, { color: colors.textSecondary, maxWidth: "80%" }]} numberOfLines={1} ellipsizeMode="tail">
              {homeLocation}
            </Text>
            <TouchableOpacity style={{ marginLeft: "auto" }}>
              <Pencil size={14} color={colors.iconMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.familyFooter}>
            <AvatarStack
              items={connections.map(conn => ({
                image: conn.image,
                name: conn.name,
              }))}
              size={32}
              colors={colors}
            />
            <TouchableOpacity
              style={[styles.manageBtn, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate("ManageConnections")}
            >
              <Text style={[styles.manageBtnText, { color: colors.primary }]}>Manage Circle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connections Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Connections</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("ManageConnections")}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ReactScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.connectionsScroll}>
          {connections.map(user => (
            <View key={user.id} style={styles.connectionItem}>
              <View style={styles.avatarWrapper}>
                <Avatar
                  image={user.image}
                  name={user.name}
                  size={56}
                  colors={colors}
                />
                {/* Only show online dot for owner if needed */}
                {user.isOwner && <View style={[styles.onlineDot, { backgroundColor: colors.primary, borderColor: colors.card }]} />}
              </View>
              <Text style={[styles.connectionName, { color: colors.textPrimary }]}>{user.name}</Text>
              <Text style={[styles.connectionRole, { color: colors.textMuted }]}>{user.role}</Text>
            </View>
          ))}
          {/* Always show invite button */}
          <TouchableOpacity
            style={styles.inviteItem}
            onPress={() =>
              navigation.navigate("ManageConnections", { tab: "Invite" })
            }>
            <View style={[styles.inviteCircle, { borderColor: colors.border }]}>
              <UserPlus size={20} color={colors.iconMuted} />
            </View>
            <Text style={[styles.inviteText, { color: colors.textMuted }]}>Invite</Text>
          </TouchableOpacity>
        </ReactScrollView>

        {/* Shared Lists Section */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Shared Lists</Text>
        {sharedLists.length === 0 ? (
          <View style={[styles.emptyListsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyListsText, { color: colors.textMuted }]}>
              No shared lists yet. Create a list and share it with your circle.
            </Text>
          </View>
        ) : (
          <View style={styles.listsContainer}>
            {sharedLists.map(list => (
              <TouchableOpacity
                key={list.id}
                style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
                onPress={() => handleListPress(list.id)}
                activeOpacity={0.7}>
                <View style={styles.listHeader}>
                  <Text style={[styles.listTitle, { color: colors.textPrimary }]}>{list.title}</Text>
                  <View style={[styles.syncedBadge, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5" }]}>
                    <Text style={[styles.syncedText, { color: isDark ? "#34d399" : "#059669" }]}>Synced</Text>
                  </View>
                </View>
                <ProgressBar percentage={list.progress} colors={colors} isDark={isDark} />
                <View style={styles.listFooter}>
                  <View style={styles.listMeta}>
                    <AvatarStack
                      items={list.avatars.map(avatar => ({
                        image: avatar,
                        name: "User",
                      }))}
                      size={35}
                      limit={2}
                      colors={colors}
                    />
                    <Text style={[styles.listUpdated, { color: colors.textMuted }]}>{list.updated}</Text>

                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleListPress(list.id);
                    }}>
                    <Text style={[styles.viewListText, { color: colors.primary }]}>View List</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Activity Section */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Recent Activity</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          {activityItems.length === 0 ? (
            <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>No recent updates yet.</Text>
          ) : (
            activityItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  index !== 0 && [styles.activityBorder, { borderTopColor: colors.divider }],
                ]}>
                <View style={{ marginRight: 12 }}>
                  <Avatar image={item.userAvatar} name={item.userName} size={32} colors={colors} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityText, { color: colors.textSecondary }]}>
                    <Text style={[styles.activityUser, { color: colors.textPrimary }]}>{item.userName} </Text>
                    {item.actionText}{" "}
                    {item.targetText ? (
                      <Text style={[styles.activityTarget, { color: colors.primary }]}>{item.targetText}</Text>
                    ) : null}
                  </Text>
                  {item.timeText ? (
                    <Text style={[styles.activityTime, { color: colors.textMuted }]}>{item.timeText}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Grow Your Circle Banner */}
        <View style={[styles.growBanner, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.15)" : "#eff6ff", borderColor: isDark ? "rgba(14, 165, 233, 0.3)" : "#dbeafe" }]}>
          <View style={styles.growHeader}>
            <View>
              <Text style={[styles.growTitle, { color: colors.textPrimary }]}>Grow your Circle</Text>
              <Text style={[styles.growSubtitle, { color: colors.textMuted }]}>
                Anyone you invite can help add or manage lists.
              </Text>
            </View>
            <View style={[styles.growIconBox, { backgroundColor: colors.primary }]}>
              <UserPlus size={20} color="#ffffff" />
            </View>
          </View>
          <View style={styles.growActions}>
            <TouchableOpacity style={[styles.inviteLinkBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Share2 size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.inviteLinkText, { color: colors.primary }]}>Invite via Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrCodeBtn, { backgroundColor: colors.primary }]}>
              <QrCode size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.qrCodeText}>QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  addUserButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    // paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Family Card
  familyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCorner: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    backgroundColor: "#f0f9ff", // Light Blue
    borderBottomLeftRadius: 120,
  },
  familyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  familyTitleContainer: {
    flex: 1,
  },
  familyTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 4,
  },
  ownerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ownerText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },
  settingsIcon: {
    marginTop: -40,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
  },
  familyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  manageBtnText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatar: {
    borderWidth: 2,
  },

  // Connections
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 12, // Default for non-row headers
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
    marginRight: 2,
  },
  connectionsScroll: {
    marginBottom: 24,
    flexGrow: 0,
  },
  connectionItem: {
    alignItems: "center",
    marginRight: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0ea5e9",
    borderWidth: 2,
    borderColor: "#fff",
  },
  connectionName: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 2,
  },
  connectionRole: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  inviteItem: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inviteCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  inviteText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },

  // Shared Lists
  listsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  listCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  syncedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncedText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#16a34a",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
  },
  fill: {
    height: 6,
    backgroundColor: "#0ea5e9",
    borderRadius: 3,
  },
  progressText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
    width: 30,
    textAlign: "right",
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listUpdated: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  viewListText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },

  emptyActivityText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    textAlign: "center",
  },
  emptyListsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  emptyListsText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: RFValue(16),
  },

  // Activity
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  activityRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 2,
  },
  activityUser: {
    fontFamily: FontFamily.bold,
    fontSize: RFValue(10),
    color: "#111827",
  },
  activityTarget: {
    color: "#0ea5e9",
    fontFamily: FontFamily.medium,
    fontSize: RFValue(10),
  },
  activityTime: {
    fontSize: RFValue(9),
    color: "#9ca3af",
  },

  // Grow Banner
  growBanner: {
    backgroundColor: "#3B82F6", // Blue
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  growHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  growTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#fff",
    marginBottom: 4,
  },
  growSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "85%",
  },
  growIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  growActions: {
    flexDirection: "row",
    gap: 12,
  },
  inviteLinkBtn: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  inviteLinkText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },
  qrCodeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  qrCodeText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#fff",
  },
});

export default CircleTab;
