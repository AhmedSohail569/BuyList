import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { View, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import {
  Plus,
  Clock,
  TrendingUp,
  Sparkles,
  Wine,
  Circle,
  Utensils,
  Carrot,
  Popcorn,
  SprayCan,
  Croissant,
  Pill,
  Baby,
} from "lucide-react-native";
import * as LucideIcons from "lucide-react-native";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import { ScrollView, Text } from "~components/Common";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";
import { RFValue } from "react-native-responsive-fontsize";
import { fetchRecentSearches, fetchTrendingSearches, clearRecentSearches } from "~redux/actions/searchActions";
import useScreenFetch from "~hooks/useScreenFetch";
import useTranslation from "~hooks/useTranslation";

// Category configurations for UI mapping
const CATEGORY_UI_MAP = {
  Beverages: { icon: Wine, bg: "#fce7f3", bgDark: "rgba(190, 24, 93, 0.2)", iconColor: "#be185d" },
  Seasonal: { icon: Circle, bg: "#ffedd5", bgDark: "rgba(180, 83, 9, 0.2)", iconColor: "#b45309" },
  Appliances: { icon: Utensils, bg: "#f3e8ff", bgDark: "rgba(126, 34, 206, 0.2)", iconColor: "#7e22ce" },
  Grocery: { icon: Carrot, bg: "#dcfce7", bgDark: "rgba(21, 128, 61, 0.2)", iconColor: "#15803d" },
  Snacks: { icon: Popcorn, bg: "#ffedd5", bgDark: "rgba(194, 65, 12, 0.2)", iconColor: "#c2410c" },
  Cleaning: { icon: SprayCan, bg: "#dbeafe", bgDark: "rgba(29, 78, 216, 0.2)", iconColor: "#1d4ed8" },
  Bakery: { icon: Croissant, bg: "#fef9c3", bgDark: "rgba(161, 98, 7, 0.2)", iconColor: "#a16207" },
  Pharmacy: { icon: Pill, bg: "#fee2e2", bgDark: "rgba(185, 28, 28, 0.2)", iconColor: "#b91c1c" },
  Baby: { icon: Baby, bg: "#fce7f3", bgDark: "rgba(190, 24, 93, 0.2)", iconColor: "#be185d" },
  Default: { icon: Sparkles, bg: "#f3f4f6", bgDark: "rgba(156, 163, 175, 0.2)", iconColor: "#6b7280" }
};

const TRENDING_COLORS = [
  { bg: "#fce7f3", bgDark: "rgba(190, 24, 93, 0.2)", iconColor: "#be185d" }, // Pink
  { bg: "#ffedd5", bgDark: "rgba(180, 83, 9, 0.2)", iconColor: "#b45309" }, // Orange
  { bg: "#f3e8ff", bgDark: "rgba(126, 34, 206, 0.2)", iconColor: "#7e22ce" }, // Purple
  { bg: "#dcfce7", bgDark: "rgba(21, 128, 61, 0.2)", iconColor: "#15803d" }, // Green
  { bg: "#dbeafe", bgDark: "rgba(29, 78, 216, 0.2)", iconColor: "#1d4ed8" }, // Blue
  { bg: "#fef9c3", bgDark: "rgba(161, 98, 7, 0.2)", iconColor: "#a16207" }, // Yellow
  { bg: "#fee2e2", bgDark: "rgba(185, 28, 28, 0.2)", iconColor: "#b91c1c" }, // Red
];

const CATEGORIES = [
  { id: 1, name: "Grocery", ...CATEGORY_UI_MAP.Grocery, color: CATEGORY_UI_MAP.Grocery.iconColor },
  { id: 2, name: "Snacks", ...CATEGORY_UI_MAP.Snacks, color: CATEGORY_UI_MAP.Snacks.iconColor },
  { id: 3, name: "Cleaning", ...CATEGORY_UI_MAP.Cleaning, color: CATEGORY_UI_MAP.Cleaning.iconColor },
  { id: 4, name: "Bakery", ...CATEGORY_UI_MAP.Bakery, color: CATEGORY_UI_MAP.Bakery.iconColor },
  { id: 5, name: "Pharmacy", ...CATEGORY_UI_MAP.Pharmacy, color: CATEGORY_UI_MAP.Pharmacy.iconColor },
  { id: 6, name: "Baby", ...CATEGORY_UI_MAP.Baby, color: CATEGORY_UI_MAP.Baby.iconColor },
];

const SUGGESTED = [
  {
    id: 1,
    name: "Oat Milk Barista",
    reason: "You buy this every Tuesday",
    tag: "Dairy",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 2,
    name: "Dish Soap Lemon",
    reason: "Low stock predicted",
    tag: "Cleaning",
    image: "https://images.unsplash.com/photo-1585837575652-2c69d0a6df32?auto=format&fit=crop&q=80&w=200",
  },
];

const SearchTab = ({ onQuickAction, navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const { 
    recentSearches, 
    trendingSearches, 
    recentLoading, 
    trendingLoading 
  } = useSelector(state => state.search);

  const fetchSearchData = useCallback(
    async () => {
      await Promise.all([
        dispatch(fetchRecentSearches()),
        dispatch(fetchTrendingSearches()),
      ]);
    },
    [dispatch],
  );

  const hasData = recentSearches.length > 0 || trendingSearches.length > 0;
  useScreenFetch(fetchSearchData, hasData);

  const handleClearSearches = () => {
    dispatch(clearRecentSearches());
  };

  const handleSearch = (query) => {
    if (!query) return;
    navigation.navigate("SearchResults", { query });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header variant="screen" title={t("search_tab_title")} />

      <SearchBar
        type={2}
        placeholder={t("search_tab_placeholder")}
        editable={false}
        onPress={() => navigation.navigate("SearchResults")}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Recent Searches */}
        {(recentSearches?.length > 0 || recentLoading) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitleSmall, { color: colors.textMuted }]}>
                {t("search_recent_label")}
              </Text>
              {recentSearches?.length > 0 && !recentLoading && (
                <TouchableOpacity onPress={handleClearSearches}>
                  <Text style={[styles.clearAllText, { color: colors.error }]}>
                    {t("search_clear_all")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.chipsContainer}>
              {recentLoading && (!recentSearches || recentSearches.length === 0) ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1, paddingVertical: 20 }} />
              ) : (
                recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSearch(item.query)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <Clock
                      size={14}
                      color={colors.iconMuted}
                      style={styles.chipIcon}
                    />
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                      {item.query}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.headerWithIcon}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("search_trending_now")}
            </Text>
          </View>
          <View style={styles.trendingRow}>
            {trendingLoading && (!trendingSearches || trendingSearches.length === 0) ? (
               <ActivityIndicator size="small" color={colors.primary} style={{ flex: 1, paddingVertical: 20 }} />
            ) : trendingSearches?.length > 0 ? (
              trendingSearches.slice(0, 3).map((item, index) => {
                // Capitalize the query just for the UI display and icon lookup
                // Handle multi-word queries like "test search" -> "TestSearch" if needed, 
                // but standard title casing is safest: "Milk"
                const queryStr = item.query ? String(item.query) : "Unknown";
                const words = queryStr.split(" ");
                const pascalCaseQuery = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
                const displayName = queryStr.charAt(0).toUpperCase() + queryStr.slice(1);

                // Check if Lucide has this icon exported
                const DynamicIcon = LucideIcons[pascalCaseQuery];
                
                // Deterministic color selection for dynamic icons
                const colorIndex = pascalCaseQuery.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % TRENDING_COLORS.length;
                const dynamicColorProps = TRENDING_COLORS[colorIndex];
                
                // If DynamicIcon exists, use random color, otherwise use Default (gray)
                const uiProps = DynamicIcon ? { icon: DynamicIcon, ...dynamicColorProps } : CATEGORY_UI_MAP.Default;
                const IconComponent = uiProps.icon;
                
                return (
                  <TouchableOpacity
                    key={item._id || index}
                    onPress={() => handleSearch(item.query)}
                    style={[
                      styles.trendingCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View
                      style={[
                        styles.trendingIconContainer,
                        { backgroundColor: isDark ? uiProps.bgDark : uiProps.bg },
                      ]}>
                      <IconComponent size={24} color={uiProps.iconColor} />
                    </View>
                    <Text
                      style={[styles.trendingName, { color: colors.textPrimary }]}
                      numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.trendingCategory, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.category || t("search_popular")}
                    </Text>
                  </TouchableOpacity>
                )
              })
            ) : null}
          </View>
        </View>

        {/* Browse Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
            {t("search_browse_categories")}
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleSearch(cat.name)}
                style={[
                  styles.categoryCard,
                  { backgroundColor: isDark ? cat.bgDark : cat.bg },
                ]}>
                <cat.icon size={28} color={cat.color} />
                <Text style={[styles.categoryName, { color: cat.color }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested for You */}
        <View style={styles.section}>
          <View style={styles.headerWithIcon}>
            <Sparkles size={20} color={colors.primary} fill={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t("search_suggested")}
            </Text>
          </View>

          <View style={styles.suggestedList}>
            {SUGGESTED.map(item => (
              <View
                key={item.id}
                style={[
                  styles.suggestedItem,
                  {
                    backgroundColor: colors.card,
                    shadowColor: colors.shadowColor,
                  },
                ]}>
                <Image
                  source={{ uri: item.image }}
                  style={[
                    styles.suggestedImage,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                />
                <View style={styles.suggestedContent}>
                  <Text
                    style={[styles.suggestedName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.suggestedReason, { color: colors.primary }]}>
                    {item.reason}
                  </Text>
                </View>
                <View style={{ gap: 10 }}>
                  <View
                    style={[
                      styles.tagContainer,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>
                      {item.tag}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: isDark ? colors.primary : "#111827" },
                    ]}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addButtonText}>{t("search_add")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  sectionTitleSmall: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  trendingRow: {
    flexDirection: "row",
    gap: 12,
  },
  trendingCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  trendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  trendingName: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: "31%",
    aspectRatio: 1,
    paddingBottom: 10,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  suggestedList: {
    gap: 12,
  },
  suggestedItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  suggestedContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestedName: {
    fontSize: 15,
    fontWeight: "700",
  },
  suggestedReason: {
    fontSize: 12,
    marginVertical: 2,
  },
  tagContainer: {
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default SearchTab;
