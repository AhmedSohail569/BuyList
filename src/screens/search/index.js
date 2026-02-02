import {View, TouchableOpacity, Image, StyleSheet} from "react-native";
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
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import {ScrollView, Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

// Mock Data
const RECENT_SEARCHES = ["Milk 1L", "Basmati Rice", "Detergent", "Avocados"];

const TRENDING = [
  {
    id: 1,
    name: "Rooh Afza",
    category: "Beverages",
    icon: Wine,
    bg: "#fce7f3",
    bgDark: "rgba(190, 24, 93, 0.2)",
    iconColor: "#be185d",
  },
  {
    id: 2,
    name: "Dates (Ajwa)",
    category: "Seasonal",
    icon: Circle,
    bg: "#ffedd5",
    bgDark: "rgba(180, 83, 9, 0.2)",
    iconColor: "#b45309",
  },
  {
    id: 3,
    name: "Air Fryer",
    category: "Appliances",
    icon: Utensils,
    bg: "#f3e8ff",
    bgDark: "rgba(126, 34, 206, 0.2)",
    iconColor: "#7e22ce",
  },
];

const CATEGORIES = [
  {
    id: 1,
    name: "Grocery",
    icon: Carrot,
    bg: "#dcfce7",
    bgDark: "rgba(21, 128, 61, 0.2)",
    color: "#15803d",
  },
  {
    id: 2,
    name: "Snacks",
    icon: Popcorn,
    bg: "#ffedd5",
    bgDark: "rgba(194, 65, 12, 0.2)",
    color: "#c2410c",
  },
  {
    id: 3,
    name: "Cleaning",
    icon: SprayCan,
    bg: "#dbeafe",
    bgDark: "rgba(29, 78, 216, 0.2)",
    color: "#1d4ed8",
  },
  {
    id: 4,
    name: "Bakery",
    icon: Croissant,
    bg: "#fef9c3",
    bgDark: "rgba(161, 98, 7, 0.2)",
    color: "#a16207",
  },
  {
    id: 5,
    name: "Pharmacy",
    icon: Pill,
    bg: "#fee2e2",
    bgDark: "rgba(185, 28, 28, 0.2)",
    color: "#b91c1c",
  },
  {
    id: 6,
    name: "Baby",
    icon: Baby,
    bg: "#fce7f3",
    bgDark: "rgba(190, 24, 93, 0.2)",
    color: "#be185d",
  },
];

const SUGGESTED = [
  {
    id: 1,
    name: "Oat Milk Barista",
    reason: "You buy this every Tuesday",
    tag: "Dairy",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 2,
    name: "Dish Soap Lemon",
    reason: "Low stock predicted",
    tag: "Cleaning",
    image:
      "https://images.unsplash.com/photo-1585837575652-2c69d0a6df32?auto=format&fit=crop&q=80&w=200",
  },
];

const SearchTab = ({onQuickAction, navigation}) => {
  const {colors, isDark} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header variant="screen" title={"Search"} />

      <SearchBar
        type={2}
        placeholder="Search products, categories..."
        editable={false}
        onPress={() => navigation.navigate("SearchResults")}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleSmall, {color: colors.textMuted}]}>
              RECENT
            </Text>
            <TouchableOpacity>
              <Text style={[styles.clearAllText, {color: colors.error}]}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsContainer}>
            {RECENT_SEARCHES.map((item, index) => (
              <TouchableOpacity
                key={index}
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
                <Text style={[styles.chipText, {color: colors.textSecondary}]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerWithIcon}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
                Trending Now
              </Text>
            </View>
          </View>
          <View style={styles.trendingRow}>
            {TRENDING.map(item => (
              <TouchableOpacity
                key={item.id}
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
                    {backgroundColor: isDark ? item.bgDark : item.bg},
                  ]}>
                  <item.icon size={24} color={item.iconColor} />
                </View>
                <Text
                  style={[styles.trendingName, {color: colors.textPrimary}]}>
                  {item.name}
                </Text>
                <Text style={[styles.trendingCategory, {color: colors.textMuted}]}>
                  {item.category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            Browse Categories
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  {backgroundColor: isDark ? cat.bgDark : cat.bg},
                ]}>
                <cat.icon size={28} color={cat.color} />
                <Text style={[styles.categoryName, {color: cat.color}]}>
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
            <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
              Suggested for You
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
                  source={{uri: item.image}}
                  style={[
                    styles.suggestedImage,
                    {backgroundColor: colors.surfaceSecondary},
                  ]}
                />
                <View style={styles.suggestedContent}>
                  <Text
                    style={[styles.suggestedName, {color: colors.textPrimary}]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.suggestedReason, {color: colors.primary}]}>
                    {item.reason}
                  </Text>
                </View>
                <View style={{gap: 10}}>
                  <View
                    style={[
                      styles.tagContainer,
                      {backgroundColor: colors.surfaceSecondary},
                    ]}>
                    <Text style={[styles.tagText, {color: colors.textMuted}]}>
                      {item.tag}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      {backgroundColor: isDark ? colors.primary : "#111827"},
                    ]}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={{height: 80}} />
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
    fontSize: 18,
    fontWeight: "700",
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600",
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
    fontSize: 14,
  },
  trendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendingCard: {
    width: "31%",
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
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: 11,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
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
    shadowOffset: {width: 0, height: 1},
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
