import {useState, useEffect} from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  Plus,
  MapPin,
  Truck,
  Filter,
  ChevronDown,
  Star,
  Share,
  Clock,
} from "lucide-react-native";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import {Modal, ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

// --- Mock Data ---
const MOCK_ONLINE_RESULTS = [
  {
    id: 1,
    title: "Organic Whole Milk (12 Pack)",
    store: "Amazon",
    rating: 4.8,
    reviews: 1205,
    price: 45.99,
    tag: "Free by Tomorrow",
    badge: "Bulk Save",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 2,
    title: "Almond Breeze (6 Pack)",
    store: "Walmart",
    rating: 4.6,
    reviews: 850,
    price: 18.5,
    tag: "2-Day Shipping",
    image:
      "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 3,
    title: "Silk Soy Milk Vanilla",
    store: "Target",
    rating: 4.5,
    reviews: 320,
    price: 3.99,
    tag: "Pickup in 2h",
    image:
      "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=200",
  },
];

const MOCK_LOCAL_RESULTS = [
  {
    id: 1,
    title: "Organic Whole Milk",
    store: "Whole Foods",
    distance: "0.8 km",
    price: 4.99,
    tag: "In Stock",
    badge: "Best Price",
    isLowStock: false,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 2,
    title: "Almond Milk Unsweetened",
    store: "Trader Joe's",
    distance: "1.2 km",
    price: 3.49,
    tag: "Low Stock",
    isLowStock: true,
    image:
      "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: 3,
    title: "Soy Milk Vanilla",
    store: "Good Foods",
    distance: "2.5 km",
    price: 2.99,
    tag: "In Stock",
    isLowStock: false,
    image:
      "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=200",
  },
];

const SearchResultsScreen = ({onQuickAction, navigation}) => {
  const {colors} = useTheme();
  const [activeTab, setActiveTab] = useState("Online Stores");
  const [searchQuery, setSearchQuery] = useState("Milk 1L");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      if (activeTab === "Online Stores") {
        setResults(MOCK_ONLINE_RESULTS);
      } else {
        setResults(MOCK_LOCAL_RESULTS);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const renderResultCard = item => {
    return (
      <View key={item.id} style={[styles.card, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
        <View style={styles.imageContainer}>
          <Image source={{uri: item.image}} style={[styles.productImage, {backgroundColor: colors.backgroundSecondary}]} />
          {(item.badge ||
            (activeTab === "Local Stores" && item.tag === "Low Stock")) && (
            <View
              style={[
                styles.badge,
                (item.badge === "Bulk Save" || item.badge === "Best Price") &&
                  styles.purpleBadge,
              ]}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.productTitle, {color: colors.textPrimary}]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.contentFooter}>
            <View>
              <View style={styles.storeRow}>
                {activeTab === "Local Stores" ? (
                  <MapPin size={12} color={colors.iconSecondary} style={{marginRight: 4}} />
                ) : (
                  <Truck size={12} color={colors.iconSecondary} style={{marginRight: 4}} />
                )}
                <Text style={[styles.storeName, {color: colors.textSecondary}]}>{item.store}</Text>
                {item.rating && (
                  <View style={styles.ratingContainer}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.ratingText, {color: colors.textMuted}]}> ({item.reviews})</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.price, {color: colors.primary}]}>
                ${item.price.toFixed(2)}
                {activeTab === "Local Stores" && item.distance && (
                  <Text style={[styles.distance, {color: colors.textSecondary}]}> · {item.distance}</Text>
                )}
              </Text>

              {item.tag && (
                <View
                  style={[
                    styles.shippingTag,
                    {backgroundColor: colors.badgeBackground},
                    item.isLowStock && {backgroundColor: colors.errorLight},
                  ]}>
                  {activeTab === "Local Stores" && item.tag === "In Stock" && (
                    <Clock size={10} color={colors.success} style={{marginRight: 2}} />
                  )}
                  <Text
                    style={[
                      styles.shippingText,
                      {color: colors.badgeText},
                      item.isLowStock && {color: colors.error},
                    ]}>
                    {item.tag}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionsColumn}>
              {activeTab === "Online Stores" && (
                <TouchableOpacity style={[styles.shareButton, {backgroundColor: colors.backgroundSecondary}]}>
                  <Share size={18} color={colors.iconSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.textPrimary}]}>
                <Plus size={20} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        variant="screen"
        title={"Search Results"}
        onBack={() => navigation.goBack()}
      />

      <SearchBar
        type={2}
        placeholder="Search products, categories..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.tabContainer, {backgroundColor: colors.backgroundSecondary}]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Local Stores" && [styles.activeTabButton, {backgroundColor: colors.card, shadowColor: colors.shadowColor}],
            ]}
            onPress={() => setActiveTab("Local Stores")}>
            <MapPin
              size={16}
              color={activeTab === "Local Stores" ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {color: colors.textMuted},
                activeTab === "Local Stores" && {color: colors.textPrimary},
              ]}>
              Local Stores
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "Online Stores" && [styles.activeTabButton, {backgroundColor: colors.card, shadowColor: colors.shadowColor}],
            ]}
            onPress={() => setActiveTab("Online Stores")}>
            <Truck
              size={16}
              color={activeTab === "Online Stores" ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                {color: colors.textMuted},
                activeTab === "Online Stores" && {color: colors.textPrimary},
              ]}>
              Online Stores
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={[styles.resultsCount, {color: colors.textSecondary}]}>
            {results.length} results found
          </Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={() => setFilterModalVisible(true)}>
              <Filter size={14} color={colors.textSecondary} />
              <Text style={[styles.filterButtonText, {color: colors.textSecondary}]}>Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={() => setFilterModalVisible(true)}>
              <Text style={[styles.filterButtonText, {color: colors.textSecondary}]}>Sort</Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : results.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, {color: colors.textPrimary}]}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={[styles.noResultsSubText, {color: colors.textSecondary}]}>
              Try adjusting your search terms.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {results.map(renderResultCard)}
          </View>
        )}
      </ScrollView>

      {/* Include Modal */}
      <Modal
        isVisible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={data => console.log("Filters Applied:", data)}
      />
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
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: -6,
    left: -6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomRightRadius: 0,
  },
  purpleBadge: {
    backgroundColor: "#9333ea",
  },
  badgeText: {
    color: "#fff",
    fontSize: RFValue(8),
    fontWeight: "700",
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  productTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeName: {
    fontSize: RFValue(9),
    marginRight: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: RFValue(9),
  },
  price: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  distance: {
    fontSize: RFValue(10),
    fontWeight: "500",
  },
  shippingTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  shippingText: {
    fontSize: RFValue(7),
    fontFamily: FontFamily.regular,
  },
  actionsColumn: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  contentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  loader: {
    marginTop: 50,
  },
  noResultsContainer: {
    marginTop: 50,
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 14,
  },
});

export default SearchResultsScreen;
