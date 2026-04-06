import { useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from "react-native";
import { Sparkles } from "lucide-react-native";
import Header from "~components/Header";
import { Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchPersonalizedRecommendations } from "~redux/actions/recommendationsActions";
import { resetRecommendations } from "~redux/reducers/recommendationsReducer";

const LIMIT = 10;

const AIRecommendationsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const { items, loading, loadingMore, error, page, hasMore } = useSelector(
    (state) => state.recommendations,
  );

  // Fetch first page on mount; reset accumulated list so we always start fresh
  useEffect(() => {
    dispatch(resetRecommendations());
    dispatch(fetchPersonalizedRecommendations({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  // Infinite scroll — load next page when the user reaches the bottom
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    dispatch(fetchPersonalizedRecommendations({ page: page + 1, limit: LIMIT }));
  }, [dispatch, loadingMore, hasMore, page]);

  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.forYouCard,
        { backgroundColor: colors.card, shadowColor: colors.shadowColor },
      ]}>
      <Image
        source={{ uri: item.image }}
        style={[styles.forYouImage, { backgroundColor: colors.backgroundSecondary }]}
      />
      <View style={styles.forYouContent}>
        <View style={styles.forYouTitleRow}>
          <Text style={[styles.forYouTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>
          {item.priceRange && (
            <View style={[styles.tagBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {item.priceRange}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.forYouDesc, { color: colors.primary }]} numberOfLines={3}>
          {item.description}
        </Text>
        <TouchableOpacity
          style={[styles.addListBtn, { backgroundColor: isDark ? colors.surface : "#111827" }]}>
          <Text style={[styles.addListText, { color: isDark ? colors.primary : "#FFF" }]}>
            + Add to List
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      // Initial loading — show skeleton placeholders
      return (
        <View style={styles.forYouContainer}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.forYouCard,
                styles.skeleton,
                { backgroundColor: colors.card, opacity: 0.4 },
              ]}
            />
          ))}
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Failed to load recommendations.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No recommendations yet. Search for products to personalise your feed!
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              AI Recommendations
            </Text>
            <Sparkles size={16} color={colors.primary} fill={colors.primary} style={{ marginLeft: 6 }} />
          </View>
        }
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={[styles.listContent, items.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 20,
  },

  // Section title (header)
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },

  forYouContainer: { gap: 16 },

  forYouCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  skeleton: {
    height: 100,
    flexDirection: "row",
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
    paddingVertical: 2,
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
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    fontStyle: "italic",
    lineHeight: 16,
    marginBottom: 8,
  },
  addListBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addListText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

export default AIRecommendationsScreen;
