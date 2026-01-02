import {View, TouchableOpacity, Image, StyleSheet} from "react-native";
import {
  Plus,
  Clock,
  TrendingUp,
  Sparkles,
  Wine,
  Circle, // For Dates
  Utensils, // For Air Fryer
  Carrot,
  Popcorn,
  SprayCan, // For Cleaning
  Croissant,
  Pill,
  Baby,
} from "lucide-react-native";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import {ScrollView, Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";

// Mock Data
const RECENT_SEARCHES = ["Milk 1L", "Basmati Rice", "Detergent", "Avocados"];

const TRENDING = [
  {
    id: 1,
    name: "Rooh Afza",
    category: "Beverages",
    icon: Wine,
    bg: "#fce7f3", // Pink-100
    iconColor: "#be185d", // Pink-700
  },
  {
    id: 2,
    name: "Dates (Ajwa)",
    category: "Seasonal",
    icon: Circle, // Nut isn't always standard, Circle looks like the date pit or fruit
    bg: "#ffedd5", // Orange-100
    iconColor: "#b45309", // Amber-700
  },
  {
    id: 3,
    name: "Air Fryer",
    category: "Appliances",
    icon: Utensils,
    bg: "#f3e8ff", // Purple-100
    iconColor: "#7e22ce", // Purple-700
  },
];

const CATEGORIES = [
  {id: 1, name: "Grocery", icon: Carrot, bg: "#dcfce7", color: "#15803d"},
  {id: 2, name: "Snacks", icon: Popcorn, bg: "#ffedd5", color: "#c2410c"},
  {id: 3, name: "Cleaning", icon: SprayCan, bg: "#dbeafe", color: "#1d4ed8"},
  {id: 4, name: "Bakery", icon: Croissant, bg: "#fef9c3", color: "#a16207"},
  {id: 5, name: "Pharmacy", icon: Pill, bg: "#fee2e2", color: "#b91c1c"},
  {id: 6, name: "Baby", icon: Baby, bg: "#fce7f3", color: "#be185d"},
];

const SUGGESTED = [
  {
    id: 1,
    name: "Oat Milk Barista",
    reason: "You buy this every Tuesday",
    tag: "Dairy",
    // Placeholder image resembling a product shot or interior as per screenshot quirk
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
  return (
    <View style={styles.container}>
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
            <Text style={styles.sectionTitleSmall}>RECENT</Text>
            <TouchableOpacity>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsContainer}>
            {RECENT_SEARCHES.map((item, index) => (
              <TouchableOpacity key={index} style={styles.chip}>
                <Clock size={14} color="#6b7280" style={styles.chipIcon} />
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerWithIcon}>
              <TrendingUp size={20} color="#2563eb" />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
          </View>
          <View style={styles.trendingRow}>
            {TRENDING.map(item => (
              <TouchableOpacity key={item.id} style={styles.trendingCard}>
                <View
                  style={[
                    styles.trendingIconContainer,
                    {backgroundColor: item.bg},
                  ]}>
                  <item.icon size={24} color={item.iconColor} />
                </View>
                <Text style={styles.trendingName}>{item.name}</Text>
                <Text style={styles.trendingCategory}>{item.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, {backgroundColor: cat.bg}]}>
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
            <Sparkles size={20} color="#0ea5e9" fill="#0ea5e9" />
            <Text style={styles.sectionTitle}>Suggested for You</Text>
          </View>

          <View style={styles.suggestedList}>
            {SUGGESTED.map(item => (
              <View key={item.id} style={styles.suggestedItem}>
                <Image
                  source={{uri: item.image}}
                  style={styles.suggestedImage}
                />
                <View style={styles.suggestedContent}>
                  <Text style={styles.suggestedName}>{item.name}</Text>
                  <Text style={styles.suggestedReason}>{item.reason}</Text>
                </View>
                <View
                  style={{
                    gap: 10,
                  }}>
                  <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton}>
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
    backgroundColor: "#f9fafb", // Light gray bg
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
    color: "#111827",
  },
  sectionTitleSmall: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 13,
    color: "#ef4444",
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    color: "#374151",
  },
  trendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendingCard: {
    width: "31%", // Approximate to fit 3 in row
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    // shadowColor: "#000",
    // shadowOffset: {width: 0, height: 1},
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
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
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: 11,
    color: "#9ca3af",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  categoryCard: {
    width: "31%", // 3 column grid
    aspectRatio: 1, // Square
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  suggestedContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestedName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  suggestedReason: {
    fontSize: 12,
    color: "#0ea5e9", // Blue text as in screenshot
    marginVertical: 2,
  },
  tagContainer: {
    backgroundColor: "#f3f4f6",
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  tagText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#111827",
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
