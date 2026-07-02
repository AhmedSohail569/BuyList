import React, {useState, useMemo, useCallback, useEffect} from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useDispatch, useSelector} from "react-redux";
import {
  fetchCircleRequests,
  acceptCircleRequest,
  rejectCircleRequest,
} from "~redux/actions/circleActions";
import {useTheme} from "~context/ThemeContext";
import useScreenFetch from "~hooks/useScreenFetch";
import {formatTimeAgo} from "~utils/time";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import useTranslation from "~hooks/useTranslation";

const getInitials = name => {
  if (!name) return "?";
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const AllCircleRequestScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();
  const {circleRequests, circleRequestsLoading, circleRequestsActioning} =
    useSelector(state => state.circles);
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");

  // Fetch circle requests
  const fetchFn = useCallback(() => {
    dispatch(fetchCircleRequests());
  }, [dispatch]);
  useScreenFetch(fetchFn, circleRequests?.length > 0);

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(circleRequests)) return [];

    if (!searchQuery.trim()) return circleRequests;

    const query = searchQuery.toLowerCase().trim();
    return circleRequests.filter(item => {
      const circleName =
        item.circleName || item.circle?.name || item.name || "Circle";
      const senderName =
        item.senderName ||
        item.sender?.username ||
        item.invitedBy?.username ||
        "";
      return (
        circleName.toLowerCase().includes(query) ||
        senderName.toLowerCase().includes(query)
      );
    });
  }, [circleRequests, searchQuery]);

  const handleAccept = useCallback(
    requestId => {
      dispatch(acceptCircleRequest({requestId}));
    },
    [dispatch],
  );

  const handleReject = useCallback(
    requestId => {
      dispatch(rejectCircleRequest({requestId}));
    },
    [dispatch],
  );

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDark ? colors.background : "#F9FAFB"},
      ]}>
      <Header
        variant="screen"
        title={t("circle_requests_title")}
        onBack={() => navigation.goBack()}
      />

      {/* Custom Search Bar matching screenshot without mic */}
      <SearchBar
        type={2}
        placeholder={t("circle_requests_search_placeholder")}
        value={searchQuery}
        onChangeText={setSearchQuery}
        editable={true}
        showSearchButton={false}
        hideMic={true}
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          marginBottom: 0,
        }}
      />
      {/* Loading state */}
      {circleRequestsLoading && circleRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredRequests.length === 0 ? (
        /* Empty state — card centered slightly above middle */
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.listCard,
              {backgroundColor: colors.card, shadowColor: colors.shadowColor},
            ]}>
            <View style={styles.emptyInner}>
              <Icon
                name="people-outline"
                size={RFValue(34)}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, {color: colors.textMuted}]}>
                {searchQuery.trim()
                  ? t("circle_requests_empty_search").replace(
                      "{{query}}",
                      searchQuery,
                    )
                  : t("circle_requests_empty")}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: Math.max(40, insets.bottom + 40)},
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View
            style={[
              styles.listCard,
              {backgroundColor: colors.card, shadowColor: colors.shadowColor},
            ]}>
            {filteredRequests.map((item, index) => {
              const requestId = item._id || item.id;
              const isActioning = !!circleRequestsActioning?.[requestId];
              const isLast = index === filteredRequests.length - 1;

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
                <View
                  key={requestId}
                  style={[
                    styles.requestRow,
                    !isLast && [
                      styles.separator,
                      {borderBottomColor: colors.divider},
                    ],
                  ]}>
                  {/* Avatar / circle image */}
                  <View style={styles.avatarWrap}>
                    {circleImage ? (
                      <Image
                        source={{uri: circleImage}}
                        style={styles.avatarImg}
                      />
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
                        <Text
                          style={[styles.timeText, {color: colors.textMuted}]}>
                          {timeAgo}
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.inviteSubtitle,
                        {color: colors.textSecondary},
                      ]}
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
                          styles.actionBtn,
                          styles.acceptBtn,
                          {backgroundColor: colors.primary},
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
                          styles.actionBtn,
                          styles.rejectBtn,
                          {
                            backgroundColor: isDark
                              ? colors.surface
                              : "#F3F4F6",
                            borderColor: isDark ? colors.border : "#E5E7EB",
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
            })}
          </View>

          <View style={{height: 40}} />
        </ScrollView>
      )}
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
    paddingTop: 10,
  },
  listCard: {
    borderRadius: 16,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  requestRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "flex-start",
  },
  separator: {
    borderBottomWidth: 1,
  },
  avatarWrap: {
    marginRight: 12,
    marginTop: 2,
  },
  avatarImg: {
    width: RFValue(40),
    height: RFValue(40),
    borderRadius: RFValue(20),
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
  },
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
    fontFamily: FontFamily.bold,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
  },
  inviteSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {},
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  rejectBtn: {
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectBtnText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: "38%",
    gap: 12,
  },
  emptyInner: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    textAlign: "center",
  },
});

export default AllCircleRequestScreen;
