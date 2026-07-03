/**
 * CircleRequestsDropdown
 *
 * A slide-down dropdown panel triggered by the users icon.
 * Shows pending circle join requests with Accept / Reject actions.
 * Mirrors the NotificationsDropdown pattern for consistency.
 */
import {useEffect, useCallback, useRef} from "react";
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
import {RFValue} from "react-native-responsive-fontsize";
import {useSelector, useDispatch} from "react-redux";

import {Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";
import {useLanguage} from "~context/LanguageContext";
import {
  fetchCircleRequests,
  acceptCircleRequest,
  rejectCircleRequest,
} from "~redux/actions/circleActions";
import {formatTimeAgo} from "~utils/time";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get("window");
const DROPDOWN_WIDTH = SCREEN_WIDTH - 68;

// ────────────────────────────────────────────────────────────────────────────────
// Helper: initials fallback
// ────────────────────────────────────────────────────────────────────────────────
const getInitials = name => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
const CircleRequestsDropdown = ({visible, onClose, onSeeAll}) => {
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();
  const {language} = useLanguage();
  const dispatch = useDispatch();

  const {circleRequests, circleRequestsLoading, circleRequestsActioning} =
    useSelector(state => state.circles);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ── Open / close animation ────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      dispatch(fetchCircleRequests());
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

  // ── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = useCallback(
    requestId => {
      dispatch(acceptCircleRequest({requestId}))
        .unwrap()
        .then(() => {
          dispatch(fetchCircleRequests());
        })
        .catch(error => {
          console.error("Accept request failed:", error);
        });
    },
    [dispatch],
  );

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = useCallback(
    requestId => {
      dispatch(rejectCircleRequest({requestId}))
        .unwrap()
        .then(() => {
          dispatch(fetchCircleRequests());
        })
        .catch(error => {
          console.error("Reject request failed:", error);
        });
    },
    [dispatch],
  );

  // ── Render single request row ──────────────────────────────────────────────
  const renderItem = useCallback(
    ({item}) => {
      const requestId = item._id || item.id;
      const isActioning = !!circleRequestsActioning[requestId];
      // Support both direct invite (circle name) and user-sent request
      const circleName =
        item.circleName || item.circle?.name || item.name || "Circle";
      const circleImage =
        item.circleImage ||
        item.invitedBy?.profilePicture ||
        item.circle?.avatar ||
        null;
      const senderName =
        item.senderName ||
        item.sender?.username ||
        item.invitedBy?.username ||
        null;
      const timeAgo = formatTimeAgo(item.createdAt || item.updatedAt);

      return (
        <View style={styles.requestRow}>
          {/* Avatar / circle image */}
          <View style={styles.avatarWrap}>
            {circleImage ? (
              <Image source={{uri: circleImage}} style={styles.avatarImg} />
            ) : (
              <View
                style={[
                  styles.avatarImg,
                  styles.avatarFallback,
                  {backgroundColor: isDark ? "#1E3A5F" : "#DBEAFE"},
                ]}>
                <Text
                  style={[
                    styles.avatarInitials,
                    {color: isDark ? "#60A5FA" : "#1E9DF1"},
                  ]}>
                  {getInitials(circleName)}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.requestContent}>
            <View style={styles.requestHeader}>
              <Text
                style={[styles.circleName, {color: colors.textPrimary}]}
                numberOfLines={1}>
                {circleName}
              </Text>
              {timeAgo ? (
                <Text style={[styles.timeText, {color: colors.textMuted}]}>
                  {timeAgo}
                </Text>
              ) : null}
            </View>

            <Text
              style={[styles.inviteSubtitle, {color: colors.textSecondary}]}
              numberOfLines={1}>
              {senderName
                ? t("circle_requests_invited_by").replace(
                    "{{name}}",
                    senderName,
                  )
                : t("circle_requests_invited_you")}
            </Text>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.acceptBtn,
                  {backgroundColor: colors.primary},
                  language === "nl" && {
                    width: undefined,
                    minWidth: 64,
                    paddingHorizontal: 12,
                  },
                  isActioning && styles.btnDisabled,
                ]}
                onPress={() => !isActioning && handleAccept(requestId)}
                activeOpacity={0.8}>
                {isActioning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptBtnText}>
                    {t("circle_requests_accept")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rejectBtn,
                  {
                    backgroundColor: isDark ? colors.surface : "#F3F4F6",
                    borderColor: isDark ? colors.border : "#E5E7EB",
                  },
                  language === "nl" && {
                    width: undefined,
                    minWidth: 64,
                    paddingHorizontal: 12,
                  },
                  isActioning && styles.btnDisabled,
                ]}
                onPress={() => !isActioning && handleReject(requestId)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.rejectBtnText,
                    {color: isDark ? "#CBD5E1" : "rgba(75, 85, 99, 1)"},
                  ]}>
                  {t("circle_requests_reject")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [
      colors,
      isDark,
      circleRequestsActioning,
      handleAccept,
      handleReject,
      t,
      language,
    ],
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  const renderEmpty = useCallback(() => {
    if (circleRequestsLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="people-outline"
          size={RFValue(34)}
          color={colors.textMuted}
        />
        <Text style={[styles.emptyText, {color: colors.textMuted}]}>
          {t("circle_requests_empty")}
        </Text>
      </View>
    );
  }, [circleRequestsLoading, colors.textMuted]);

  // ── Footer loader ─────────────────────────────────────────────────────────
  const renderFooter = useCallback(() => {
    if (!circleRequestsLoading || circleRequests.length > 0) return null;
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [circleRequestsLoading, circleRequests.length, colors.primary]);

  const keyExtractor = useCallback(
    (item, index) => item._id || item.id || `req-${index}`,
    [],
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, {opacity: opacityAnim}]}>
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
              ]}>
              {/* ── Header ────────────────────────────────────────────────── */}
              <View style={styles.dropdownHeader}>
                <Text style={[styles.headerTitle, {color: colors.textPrimary}]}>
                  {t("circle_requests_dropdown_title")}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  style={styles.closeButton}>
                  <Icon
                    name="close"
                    size={RFValue(18)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* ── Divider ───────────────────────────────────────────────── */}
              <View
                style={[styles.divider, {backgroundColor: colors.divider}]}
              />

              {/* ── Request list ──────────────────────────────────────────── */}
              <FlatList
                data={circleRequests}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                style={styles.list}
                contentContainerStyle={
                  circleRequests.length === 0 && styles.emptyList
                }
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={5}
                ItemSeparatorComponent={() => (
                  <View
                    style={[
                      styles.separator,
                      {backgroundColor: colors.divider},
                    ]}
                  />
                )}
              />

              {/* ── Footer: See all ───────────────────────────────────────── */}
              <TouchableOpacity
                style={[styles.seeAllFooter, {borderTopColor: colors.divider}]}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onSeeAll?.();
                }}>
                <Text style={[styles.seeAllText, {color: colors.textMuted}]}>
                  {t("circle_requests_see_all")}
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
const DROPDOWN_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;

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
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    overflow: "hidden",
  },

  // Header
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  closeButton: {
    padding: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
  },

  // List
  list: {
    maxHeight: DROPDOWN_MAX_HEIGHT - 130,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Request row
  requestRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "flex-start",
  },
  avatarWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  avatarImg: {
    width: RFValue(38),
    height: RFValue(38),
    borderRadius: RFValue(19),
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },

  // Content
  requestContent: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  circleName: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.regular,
  },
  inviteSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    width: 64,
    height: 29,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  rejectBtn: {
    width: 64,
    height: 29,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Separator
  separator: {
    height: 1,
    marginHorizontal: 16,
  },

  // Footer
  seeAllFooter: {
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  seeAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    textDecorationLine: "underline",
  },

  // Loader
  loaderWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
  },
});

export default CircleRequestsDropdown;
