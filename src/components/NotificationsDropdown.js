/**
 * NotificationsDropdown
 *
 * A slide-down dropdown panel triggered by the bell icon.
 * All data is managed via Redux (notificationActions / notificationReducer).
 * Supports pagination, mark-as-read (single + all), and clear-all.
 */
import { useEffect, useCallback, useRef, useMemo } from "react";
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
import { useSelector, useDispatch } from "react-redux";

import { Text } from "~components/Common";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "~redux/actions/notificationActions";
import { formatTimeAgo } from "~utils/time";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

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

const NotificationsDropdown = ({ visible, onClose }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state
  const { items, loading, hasMore, page, markingAll } = useSelector(
    (state) => state.notifications,
  );

  // Animation refs (UI-only — stays local)
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Derived unread count
  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );

  // ── Animate open / close ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      dispatch(fetchNotifications({ page: 1 }));
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

  // ── Load more (pagination) ────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(fetchNotifications({ page: page + 1 }));
    }
  }, [loading, hasMore, page, dispatch]);

  // ── Handle notification press ─────────────────────────────────────────────
  const handlePress = useCallback(
    (item) => {
      const id = item._id || item.id;
      if (!item.isRead) {
        dispatch(markNotificationRead(id));
      }
    },
    [dispatch],
  );

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAll = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  // ── Render a single notification row ──────────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => {
      const iconCfg = getNotificationIcon(item.type);
      const isUnread = !item.isRead;

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
          <View style={[styles.notifIcon, { backgroundColor: iconCfg.bg }]}>
            {item.senderAvatar || item.actor?.profilePicture ? (
              <Image
                source={{
                  uri: item.senderAvatar || item.actor?.profilePicture,
                }}
                style={styles.notifAvatarImg}
              />
            ) : (
              <Icon
                name={iconCfg.name}
                size={RFValue(18)}
                color={iconCfg.color}
              />
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

  // ── Footer loader ─────────────────────────────────────────────────────────
  const renderFooter = useCallback(() => {
    if (!loading || items.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loading, items.length, colors.primary]);

  // ── Empty state ───────────────────────────────────────────────────────────
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

  // ── Key extractor ─────────────────────────────────────────────────────────
  const keyExtractor = useCallback(
    (item, index) => item._id || item.id || `notif-${index}`,
    [],
  );

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
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
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
                <View style={styles.headerRight}>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={RFValue(18)} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Notification list ────────────────────────────────────── */}
              <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                style={styles.list}
                contentContainerStyle={
                  items.length === 0 && styles.emptyList
                }
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={6}
                maxToRenderPerBatch={8}
              />

              {/* ── Footer ──────────────────────────────────────────────── */}
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={[styles.footer, { borderTopColor: colors.divider }]}
                  activeOpacity={0.7}
                  onPress={handleMarkAll}
                  disabled={markingAll}
                >
                  <Text
                    style={[
                      styles.markAllFooterText,
                      { color: colors.primary },
                      markingAll && { opacity: 0.5 },
                    ]}
                  >
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    padding: 2,
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
  markAllFooterText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },

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
