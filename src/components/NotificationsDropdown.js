/**
 * NotificationsDropdown
 *
 * A slide-down dropdown panel that appears when the bell icon is pressed.
 * Fetches notifications with pagination, supports mark-as-read (single + all),
 * clear all, and shows relative timestamps with unread indicators.
 *
 * Matching the screenshot: white card, "Notifications" header + "Mark all as read",
 * icon-left notification rows, blue unread dot, "See all recent Activity" footer link.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";
import { useNavigation } from "@react-navigation/native";

import { Text } from "~components/Common";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import axiosInstance from "~utils/axiosInstance";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

/** Map notification type to an icon config */
const getNotificationIcon = (type) => {
  switch (type?.toLowerCase?.()) {
    case "list":
    case "new_list_item":
    case "list_update":
      return { name: "people-circle", bg: "#FFF3E0", color: "#FB8C00" };
    case "price":
    case "price_drop":
      return { name: "star", bg: "#E8F5E9", color: "#43A047" };
    case "system":
    case "system_update":
      return { name: "document-text", bg: "#E3F2FD", color: "#1E88E5" };
    case "circle":
    case "circle_update":
      return { name: "people", bg: "#F3E8FF", color: "#9333EA" };
    default:
      return { name: "notifications", bg: "#E3F2FD", color: "#1E88E5" };
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────

const NotificationsDropdown = ({ visible, onClose, anchorY = 0 }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  // Data state
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ── Fetch notifications ─────────────────────────────────────────────────────

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/notifications/get-notifications?page=${pageNum}`,
        );
        const data = res.data?.data?.notifications || res.data?.data || res.data?.notifications || [];
        const totalPages = res.data?.data?.totalPages || res.data?.totalPages || 1;
        
        if (append) {
          setNotifications((prev) => [...prev, ...data]);
        } else {
          setNotifications(data);
        }
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } catch (err) {
        console.error("❌ fetchNotifications error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loading],
  );

  // ── Mark single as read ─────────────────────────────────────────────────────

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axiosInstance.patch(
        `/notifications/mark-single-read/${notificationId}`,
      );
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    } catch (err) {
      console.error("❌ markAsRead error:", err);
    }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────────────────

  const markAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await axiosInstance.patch("/notifications/all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("❌ markAllAsRead error:", err);
    } finally {
      setMarkingAll(false);
    }
  }, []);

  // ── Clear all notifications ─────────────────────────────────────────────────

  const clearAll = useCallback(async () => {
    try {
      await axiosInstance.delete("/notifications/clear-notifications");
      setNotifications([]);
    } catch (err) {
      console.error("❌ clearAll error:", err);
    }
  }, []);

  // ── Load more (pagination) ──────────────────────────────────────────────────

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // ── Animate open/close ──────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      fetchNotifications(1, false);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Unread count ────────────────────────────────────────────────────────────

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // ── Handle notification press ───────────────────────────────────────────────

  const handlePress = useCallback(
    (item) => {
      const id = item._id || item.id;
      if (!item.isRead) {
        markAsRead(id);
      }
      // Could navigate somewhere based on item.type / item.data
    },
    [markAsRead],
  );

  // ── See all activity ────────────────────────────────────────────────────────

  const handleSeeAll = useCallback(() => {
    onClose();
    navigation.navigate("Notifications");
  }, [onClose, navigation]);

  // ── Render a single notification row ────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }) => {
      const iconCfg = getNotificationIcon(item.type);
      const isUnread = !item.isRead;
      const id = item._id || item.id;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePress(item)}
          style={[
            styles.notifRow,
            isUnread && {
              backgroundColor: isDark
                ? "rgba(30, 157, 241, 0.06)"
                : "rgba(30, 157, 241, 0.03)",
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[styles.notifIcon, { backgroundColor: iconCfg.bg }]}
          >
            {item.senderAvatar || item.actor?.profilePicture ? (
              <Image
                source={{
                  uri: item.senderAvatar || item.actor?.profilePicture,
                }}
                style={styles.notifAvatarImg}
              />
            ) : (
              <Icon name={iconCfg.name} size={RFValue(18)} color={iconCfg.color} />
            )}
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <Text
              style={[
                styles.notifTitle,
                { color: colors.textPrimary },
                isUnread && { fontFamily: FontFamily.bold },
              ]}
              numberOfLines={1}
            >
              {item.title || "Notification"}
            </Text>
            <Text
              style={[styles.notifBody, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.body || item.message || ""}
            </Text>
          </View>

          {/* Time + unread dot */}
          <View style={styles.notifMeta}>
            <Text style={[styles.notifTime, { color: colors.textMuted }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      );
    },
    [colors, isDark, handlePress],
  );

  // ── Footer loader ──────────────────────────────────────────────────────────

  const renderFooter = useCallback(() => {
    if (!loading || notifications.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, notifications.length, colors.primary]);

  // ── Empty state ────────────────────────────────────────────────────────────

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="notifications-off-outline"
          size={RFValue(36)}
          color={colors.textMuted}
        />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No notifications yet
        </Text>
      </View>
    );
  }, [loading, colors.textMuted]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: opacityAnim },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.modalBackground,
                  shadowColor: colors.shadowColor,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                    {
                      scale: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.97, 1],
                      }),
                    },
                  ],
                  opacity: slideAnim,
                },
              ]}
            >
              {/* ── Header ──────────────────────────────────────────────── */}
              <View style={styles.header}>
                <Text
                  style={[styles.headerTitle, { color: colors.textPrimary }]}
                >
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    disabled={markingAll}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[
                        styles.markAllText,
                        { color: colors.primary },
                        markingAll && { opacity: 0.5 },
                      ]}
                    >
                      Mark all as read
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Notification list ────────────────────────────────────── */}
              <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id || String(Math.random())}
                style={styles.list}
                contentContainerStyle={
                  notifications.length === 0 && styles.emptyList
                }
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
              />

              {/* ── Footer link ──────────────────────────────────────────── */}
              <TouchableOpacity
                style={[
                  styles.footer,
                  { borderTopColor: colors.divider },
                ]}
                activeOpacity={0.7}
                onPress={handleSeeAll}
              >
                <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>
                  See all recent Activity
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────────

const DROPDOWN_WIDTH = SCREEN_WIDTH - 48;
const DROPDOWN_MAX_HEIGHT = SCREEN_HEIGHT * 0.5;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  dropdown: {
    position: "absolute",
    top: RFValue(110),
    right: 16,
    width: DROPDOWN_WIDTH > 380 ? 380 : DROPDOWN_WIDTH,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    overflow: "hidden",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
  },
  markAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },

  // List
  list: {
    maxHeight: DROPDOWN_MAX_HEIGHT - 120,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Notification row
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  notifIcon: {
    width: RFValue(35),
    height: RFValue(35),
    borderRadius: RFValue(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  notifAvatarImg: {
    width: RFValue(35),
    height: RFValue(35),
    borderRadius: RFValue(20),
  },
  notifContent: {
    flex: 1,
    marginRight: 8,
  },
  notifTitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(15),
  },
  notifMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  notifTime: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E9DF1",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  seeAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    textDecorationLine: "underline",
  },

  // Footer loader
  footerLoader: {
    paddingVertical: 12,
    alignItems: "center",
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
  },
});

export default NotificationsDropdown;
