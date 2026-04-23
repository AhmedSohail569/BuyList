import { useMemo, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
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
  Shield,
  Plus,
  MoreVertical
} from "lucide-react-native";
import { Menu } from "react-native-paper";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import Header from "~components/Header";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { fetchAllCircles, createCircle, fetchAllConnections, leaveCircle } from "~redux/actions/circleActions";
import SelectionModal from "~containers/modals/SelectionModal";
import { BottomModal } from "~components/Common/Modal";
import { fetchRecentActivities, fetchAllLists } from "~redux/actions/listActions";
import { useTheme } from "~context/ThemeContext";
import useOnReconnect from "~hooks/useOnReconnect";
import useScreenFetch from "~hooks/useScreenFetch";
import useLocation from "~hooks/useLocation";
import Avatar from "~components/Avatar";
import { normalizeActivity } from "~utils/display";
import { formatListTimeAgo } from "~utils/time";
import useTranslation from "~hooks/useTranslation";

// Helper function to format role for display
const formatRole = (role) => {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Build connections list from allCircles data (circle-specific, not shared)
const buildConnections = (allCircles) => {
  if (!allCircles || !Array.isArray(allCircles)) return [];
  const connections = [];
  
  allCircles.forEach(circle => {
    if (circle.owner) {
      connections.push({
        id: circle.owner._id || circle.owner.id,
        name: circle.owner.username || circle.owner.email || "Owner",
        role: "Owner",
        image: circle.owner.profilePicture,
        isOwner: true,
      });
    }
    if (circle.members && Array.isArray(circle.members)) {
      circle.members.forEach((member) => {
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
  });

  // Deduplicate connections by ID
  const uniqueConnections = [];
  const seenIds = new Set();
  connections.forEach(conn => {
    if (!seenIds.has(conn.id)) {
      seenIds.add(conn.id);
      uniqueConnections.push(conn);
    }
  });
  
  return uniqueConnections;
};

// Helper function to convert hex to rgb string for rgba usage
const hexToRgbStr = (hex) => {
  if (!hex) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

// --- Sub Components ---

// Avatar Stack Component
const AvatarStack = ({ items, size = 24, limit = 3, colors, isDark }) => {
  // items can be array of {image, name} objects or array of image strings (for backward compatibility)
  const avatarItems = items.map((item, index) => {
    if (typeof item === "string") {
      // Backward compatibility: if it's a string, treat as image
      return { image: item, name: "User" };
    }
    return item;
  });

  const displayedItems = avatarItems.slice(0, limit);
  const remainingCount = avatarItems.length > limit ? avatarItems.length - limit : 0;

  return (
    <View style={styles.avatarStack}>
      {displayedItems.map((item, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -8,
            zIndex: avatarItems.length - index,
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
      {remainingCount > 0 && (
        <View
          style={[
            styles.plusCounter,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -8,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6",
              borderColor: colors?.card || "#fff",
              zIndex: 0,
            },
          ]}>
          <Text style={[styles.plusText, { color: colors?.textSecondary || "#6b7280" }]}>
            +{remainingCount}
          </Text>
        </View>
      )}
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
  const { t } = useTranslation();
  const { 
    allCircles, 
    loading, 
    createLoading,
    allConnections,
    connectionsLoading,
  } = useSelector(state => state.circles);
  const { recentActivities, lists } = useSelector(state => state.lists);
  const { user } = useSelector(state => state.auth);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [circleToLeave, setCircleToLeave] = useState(null);

  console.log("allConnections", allConnections);

  // Fetch all circles on screen mount or manually triggered
  const fetchFn = useCallback(() => {
    dispatch(fetchAllCircles());
    dispatch(fetchAllConnections());
    dispatch(fetchRecentActivities());
    dispatch(fetchAllLists());
  }, [dispatch]);
  
  // Use useScreenFetch for standard screen loading management
  useScreenFetch(fetchFn, allCircles.length > 0 || allConnections.length > 0);

  // Re-fetch data when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchAllCircles());
    dispatch(fetchAllConnections());
    dispatch(fetchRecentActivities());
    dispatch(fetchAllLists());
  });

  const handleSaveCircle = async (data) => {
   
    try {
      await dispatch(createCircle(data)).unwrap();
      await dispatch(fetchAllCircles());
      Toast.show({
        type: "success",
        text1: t("circle_create_success"),
        text2: t("circle_create_success_desc"),
      });
      setCreateModalVisible(false);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err || "Failed to create circle",
      });
    }
  };

  // Handle Leave Circle confirmation
  const handleLeaveConfirm = async () => {
    if (!circleToLeave) return;
    try {
      await dispatch(leaveCircle({ circleId: circleToLeave.id || circleToLeave._id })).unwrap();
      Toast.show({
        type: "success",
        text1: t("circle_leave_success_title"),
        text2: t("circle_leave_success_desc"),
      });
      setLeaveModalVisible(false);
      setCircleToLeave(null);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: t("common_error"),
        text2: typeof err === "string" ? err : t("common_unexpected_error"),
      });
    }
  };

  const openLeaveConfirmation = (circle) => {
    setCircleToLeave(circle);
    setLeaveModalVisible(true);
    setActiveMenuId(null);
  };

  // Sorted circles: Owned first, and among owned, default first
  const sortedCircles = useMemo(() => {
    if (!Array.isArray(allCircles)) return [];
    return [...allCircles].sort((a, b) => {
      const aIsOwned = a.owner?._id === user?._id;
      const bIsOwned = b.owner?._id === user?._id;

      // Rule 1: Owned circles come first
      if (aIsOwned && !bIsOwned) return -1;
      if (!aIsOwned && bIsOwned) return 1;

      // Rule 2: Among owned circles, default circle comes first
      if (aIsOwned && bIsOwned) {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
      }

      return 0;
    });
  }, [allCircles, user?._id]);
  
  // Deduplicate connections from Redux and include self
  const uniqueConnections = useMemo(() => {
    // Start with current user as owner
    const self = user ? {
      ...user,
      id: user.id || user._id,
      name: user.username || user.name || user.email || "Me",
      role: "owner",
      isSelf: true
    } : null;

    const connections = Array.isArray(allConnections) ? allConnections : [];
    const seen = new Set();
    if (self) seen.add(self.id);

    const filtered = connections.filter(c => {
      const id = c.id || c._id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return self ? [self, ...filtered] : filtered;
  }, [allConnections, user]);

  const currentCircle = Array.isArray(sortedCircles) && sortedCircles.length > 0 ? sortedCircles[0] : null;

  // Get circle name or default
  const circleName = currentCircle?.name || "Circle";
  const homeLocation = currentCircle?.owner?.zone || t("circle_set_location");
  const activityItems = useMemo(() => {
    const source = Array.isArray(recentActivities) ? recentActivities : [];
    return source.slice(0, 5).map((activity, index) => normalizeActivity(activity, index, t));
  }, [recentActivities, t]);

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

      // Get member avatars and names for initials fallback
      const members = list.members || [];
      const avatars = members
        .slice(0, 3)
        .map(member => ({
          image: member?.profilePicture || null,
          name: member?.username || member?.name || member?.email || "User",
        }));

        return {
          id: list.id || list._id,
          title: list.name || "Untitled List",
          progress: progress.percentage,
          updated: formatListTimeAgo(list.updatedAt || list.createdAt),
          avatars: avatars.length > 0 ? avatars : [{ image: null, name: "User" }],
          color: list.circle?.color,
        };
      });
  }, [lists]);

  const handleListPress = useCallback((listId) => {
    navigation.navigate("ListDetails", { listId });
  }, [navigation]);

  const { requestLocationPermission } = useLocation();

  const handleMapNavigation = useCallback(async () => {
    const hasPermission = await requestLocationPermission(true);
    if (hasPermission) {
      navigation.navigate("ChangeHomeLocation");
    }
  }, [requestLocationPermission, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="title"
        title={t("circle_title")}
        subtitle={t("circle_subtitle")}
        rightAction={
          <TouchableOpacity 
            style={[styles.addUserButton, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]} 
            onPress={() => setCreateModalVisible(true)}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />


      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Circle Cards List */}
        {sortedCircles && sortedCircles.length > 0 ? (
          sortedCircles.map((circle, index) => {
            const currentCircleName = circle.name || "Circle";
            const currentCircleConnections = buildConnections([circle]);
            
            const baseThemeColor = circle.color || colors.primary;
            const rgbColor = hexToRgbStr(circle.color);
            
            // Accent colors (decorative corner and icon bg = 20% opacity)
            const cornerBgColor = circle.color && rgbColor 
              ? `rgba(${rgbColor}, 0.2)` 
              : (isDark ? "rgba(14, 165, 233, 0.1)" : "#f0f9ff");
              
            const iconBgColor = circle.color && rgbColor 
              ? `rgba(${rgbColor}, 0.2)` 
              : (isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe");
              
            const badgeBgColor = circle.color && rgbColor 
              ? `rgba(${rgbColor}, 0.15)` 
              : (isDark ? "rgba(14, 165, 233, 0.15)" : "#eff6ff");
              
            const badgeBorderColor = circle.color && rgbColor 
              ? `rgba(${rgbColor}, 0.3)` 
              : (isDark ? "rgba(14, 165, 233, 0.3)" : "#dbeafe");
            
            return (
              <View key={circle.id || circle._id || index} style={[styles.familyCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
                {/* Decorative Corner */}
                 <View style={[styles.decorativeCorner, { backgroundColor: cornerBgColor }]} />

                <View style={styles.familyHeaderRow}>
                  <View style={[styles.iconBg, { backgroundColor: iconBgColor }]}>
                    <ShoppingBag size={20} color={baseThemeColor} />
                  </View>
                  <View style={styles.familyTitleContainer}>
                      <Text style={[styles.familyTitle, { color: colors.textPrimary }]}>{currentCircleName}</Text>
                   
                    {circle.owner._id === user._id && 
                      <View style={styles.badgeContainer}><View style={[styles.ownerBadge, { backgroundColor: badgeBgColor, borderColor: badgeBorderColor }]}>
                        <Shield size={12} color={baseThemeColor}/>
                        <Text style={[styles.ownerText, { color: baseThemeColor }]}>{t("circle_owner")}</Text>
                      </View>{circle.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: isDark ? "rgba(107, 114, 128, 0.1)" : "#F2F2F233", borderColor: isDark ? "rgba(107, 114, 128, 0.2)" : "#00000040" }]}>
                          <Text style={[styles.defaultText]}>{t("circle_default_badge")}</Text>
                        </View>
                      )}</View>
                    }
                  </View>
                  {circle.owner._id === user._id ? (
                    <TouchableOpacity
                      style={styles.settingsIcon}
                      onPress={() =>
                        navigation.navigate("CircleSettings", {
                          circleId: circle.id || circle._id,
                          currentCircle: circle,
                        })
                      }
                    >
                      <Settings size={RFValue(16)} color={colors.iconSecondary} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.settingsIcon, {marginTop: -20}]}>
                      <Menu
                        visible={activeMenuId === (circle.id || circle._id)}
                        onDismiss={() => setActiveMenuId(null)}
                        anchor={
                          <TouchableOpacity
                            onPress={() => setActiveMenuId(circle.id || circle._id)}
                            hitSlop={15}
                          >
                            <MoreVertical size={RFValue(16)} color={colors.iconSecondary} />
                          </TouchableOpacity>
                        }
                        contentStyle={[styles.menuContent, { backgroundColor: colors.card }]}
                      >
                        <Menu.Item
                          onPress={() => openLeaveConfirmation(circle)}
                          title={t("circle_leave_btn")}
                          titleStyle={[styles.menuItemTitleDelete]}
                        />
                      </Menu>
                    </View>
                  )}
                </View>

                <View style={styles.familyFooter}>
                  <AvatarStack
                    items={currentCircleConnections.map(conn => ({
                      image: conn.image,
                      name: conn.name,
                    }))}
                    size={32}
                    colors={colors}
                    isDark={isDark}
                  />
                  {circle.owner._id === user._id && <TouchableOpacity
                    style={[styles.manageBtn, { borderColor: baseThemeColor }]}
                    onPress={() => navigation.navigate("ManageConnections", { circleId: circle.id || circle._id, currentCircle: circle, tab: "Connections" })}
                  >
                    <Text style={[styles.manageBtnText, { color: baseThemeColor }]}>{t("circle_manage_btn")}</Text>
                  </TouchableOpacity>}
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.familyCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor, alignItems: "center", paddingVertical: 32 }]}>
            <Text style={{ color: colors.textMuted, fontSize: RFValue(12), fontFamily: FontFamily.medium }}>
              {t("circle_no_circles")}
            </Text>
          </View>
        )}


        {/* Connections Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>{t("circle_connections")}</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("AllConnections")}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>{t("circle_view_all")}</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ReactScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.connectionsScroll}>
          {uniqueConnections.length === 0 && !connectionsLoading ? (
            <View style={styles.noConnectionsWrapper}>
              <Text style={[styles.noConnectionsText, { color: colors.textMuted }]}>
                {t("manage_no_connections")}
              </Text>
            </View>
          ) : (
            uniqueConnections.map(user => {
              const name = user.username || user.name || user.email || "User";
              const role = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Member";
              const isOwner = user.role?.toLowerCase() === "owner";
              
              return (
                <View key={user.id || user._id} style={styles.connectionItem}>
                  <View style={[
                    styles.avatarWrapper,
                    user.circleColor && { 
                      padding: 2, 
                      borderWidth: 2, 
                      borderColor: user.circleColor,
                      borderRadius: 34, // (56 + 4)/2 + some safety
                    }
                  ]}>
                    <Avatar
                      image={user.profilePicture || user.image}
                      name={name}
                      size={56}
                      colors={colors}
                    />
                    {isOwner && (
                      <View style={[styles.avatarOwnerBadge, { backgroundColor: colors.primary, borderColor: colors.card, right: user.circleColor ? -2 : 2, bottom: user.circleColor ? -2 : 2 }]}>
                        <Shield size={8} color="#fff" fill="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.connectionName, { color: colors.textPrimary }]}>{name}</Text>
                  <Text style={[styles.connectionRole, { color: colors.textMuted }]}>{role}</Text>
                </View>
              );
            })
          )}
        </ReactScrollView>

        {/* Shared Lists Section */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>{t("circle_shared_lists")}</Text>
        {sharedLists.length === 0 ? (
          <View style={[styles.emptyListsContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyListsText, { color: colors.textMuted }]}>
              {t("circle_no_shared_lists")}
            </Text>
          </View>
        ) : (
          <View style={styles.listsContainer}>
            {sharedLists.map(list => {
              
              const listThemeColor = list?.color || colors.primary;
              
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.listCard, 
                    { 
                      backgroundColor: colors.card, 
                      shadowColor: colors.shadowColor,
                      borderLeftWidth: 4,
                      borderLeftColor: listThemeColor,
                    }
                  ]}
                  onPress={() => handleListPress(list.id)}
                  activeOpacity={0.7}>
                  <View style={styles.listHeader}>
                    <Text style={[styles.listTitle, { color: colors.textPrimary }]}>{list.title}</Text>
                    <View style={[styles.syncedBadge, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#d1fae5" }]}>
                      <Text style={[styles.syncedText, { color: isDark ? "#34d399" : "#059669" }]}>{t("circle_synced")}</Text>
                    </View>
                  </View>
                  <ProgressBar percentage={list.progress} colors={{...colors, primary: colors.primary}} isDark={isDark} />
                  <View style={styles.listFooter}>
                    <View style={styles.listMeta}>
                      <AvatarStack
                        items={list.avatars}
                        size={35}
                        limit={3}
                        colors={colors}
                      />
                      <Text style={[styles.listUpdated, { color: colors.textMuted }]}>{list.updated}</Text>
  
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleListPress(list.id);
                      }}>
                      <Text style={[styles.viewListText, { color: colors.primary }]}>{t("circle_view_list")}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Activity Section */}
        <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>{t("circle_activity")}</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          {activityItems.length === 0 ? (
            <Text style={[styles.emptyActivityText, { color: colors.textMuted }]}>{t("circle_no_activity")}</Text>
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
              <Text style={[styles.growTitle, { color: colors.textPrimary }]}>{t("circle_grow_title")}</Text>
              <Text style={[styles.growSubtitle, { color: colors.textMuted }]}>
                {t("circle_grow_desc")}
              </Text>
            </View>
            <TouchableOpacity style={[styles.growIconBox, { backgroundColor: colors.primary }]}  onPress={() =>
              navigation.navigate("ManageConnections", { tab: "Invite" })
            }>
              <UserPlus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.growActions}>
            <TouchableOpacity style={[styles.inviteLinkBtn, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => navigation.navigate("ManageConnections", { tab: "Invite" })}>
              <Share2 size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.inviteLinkText, { color: colors.primary }]}>{t("circle_invite_link")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrCodeBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("ManageConnections", { tab: "Invite" })}>
              <QrCode size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.qrCodeText}>{t("circle_qr_code")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomModal
        isVisible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onApply={handleSaveCircle}
        type="createCircle"
      />

      <SelectionModal
        isVisible={leaveModalVisible}
        onClose={() => {
          setLeaveModalVisible(false);
          setCircleToLeave(null);
        }}
        onSave={handleLeaveConfirm}
        type="confirmation"
        title={t("circle_leave_confirm_title")}
        description={t("circle_leave_confirm_desc")}
        danger
        confirmLabel={loading ? t("common_loading") : t("circle_leave_btn")}
        cancelLabel={t("common_cancel")}
      />
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
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  ownerText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F233',
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  defaultText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#6B7280",
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
  avatarOwnerBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: RFValue(12),
    height: RFValue(12),
    borderRadius: RFValue(6),
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
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
  plusCounter: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  plusText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  noConnectionsWrapper: {
    paddingVertical: 12,
    marginRight: 20,
    justifyContent: "center",
  },
  noConnectionsText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
  },
  menuContent: {
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 150,
  },
  menuItemTitleDelete: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
});

export default CircleTab;
