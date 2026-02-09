import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Search,
  Star,
  BarChart2,
  CheckCircle,
  Truck,
  RotateCcw,
  ShoppingCart,
  ChevronDown,
} from "lucide-react-native";
import Header from "~components/Header"; // Assuming generic header available
import { Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";

const { width } = Dimensions.get("window");

// --- MOCK DATA ---
const PRODUCT = {
  title: "Sony WH-1000XM5 Wireless NC Headphones",
  category: "ELECTRONICS",
  rating: 4.8,
  msrp: "$399.99",
  image:
    "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=200&q=80", // Placeholder headphone image
};

const OFFERS = [
  {
    id: 1,
    store: "Amazon",
    storeLogoBg: "#FACC15", // Yellow
    storeLogoText: "Amz",
    type: "Online",
    price: 348.0,
    oldPrice: 359.0,
    isBestPrice: true,
    stockStatus: "In Stock",
    shipping: "Free Prime\n(Tomorrow)",
    returns: "30 Days",
    color: "#22C55E", // Green theme
  },
  {
    id: 2,
    store: "Best Buy",
    storeLogoBg: "#2563EB", // Blue
    storeLogoText: "BB",
    type: "2.4 mi",
    price: 349.99,
    oldPrice: null,
    isBestPrice: false,
    stockStatus: "Low Stock",
    shipping: "Pickup\n(Today)",
    returns: "15 Days",
    color: "#1F2937", // Default
  },
];

const SPECS = [
  { label: "Noise Cancelling", value: "Industry Leading Active NC" },
  { label: "Battery Life", value: "30 Hours (NC On)" },
  { label: "Weight", value: "250g" },
  { label: "Bluetooth", value: "5.2 with LDAC" },
];

const PriceCheckScreen = ({ navigation }) => {
  const { colors } = useTheme();

  // --- Render Store Card ---
  const renderStoreCard = item => {
    const isBest = item.isBestPrice;

    return (
      <View
        key={item.id}
        style={[
          styles.offerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isBest && [styles.offerCardBest, { borderColor: colors.success }]
        ]}>
        {/* Best Price Badge */}
        {isBest && (
          <View style={[styles.bestPriceBadge, { backgroundColor: colors.success }]}>
            <CheckCircle size={10} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.bestPriceText}>Best Price</Text>
          </View>
        )}

        {/* Header: Logo & Name */}
        <View style={styles.offerHeader}>
          <View style={[styles.storeLogo, { backgroundColor: item.storeLogoBg }]}>
            <Text style={styles.storeLogoText}>{item.storeLogoText}</Text>
          </View>
          <View>
            <Text style={[styles.storeName, { color: colors.textPrimary }]}>{item.store}</Text>
            <Text style={[styles.storeType, { color: colors.textSecondary }]}>{item.type}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceRow}>
          <Text style={[styles.currentPrice, { color: colors.textPrimary }, isBest && { color: colors.success }]}>
            ${item.price.toFixed(2)}
          </Text>
          {item.oldPrice && (
            <Text style={[styles.oldPrice, { color: colors.textMuted }]}>${item.oldPrice.toFixed(2)}</Text>
          )}
        </View>
        <Text style={[styles.taxNote, { color: colors.textMuted }]}>Taxes calculated at checkout</Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Row 1: Stock */}
          <View style={styles.detailRow}>
            <CheckCircle size={14} color={colors.iconSecondary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Stock</Text>
            <View
              style={[
                styles.stockBadge,
                item.stockStatus === "In Stock"
                  ? { backgroundColor: colors.successLight }
                  : { backgroundColor: colors.warningLight },
              ]}>
              <Text
                style={[
                  styles.stockText,
                  item.stockStatus === "In Stock"
                    ? { color: colors.successDark }
                    : { color: colors.warningDark },
                ]}>
                {item.stockStatus}
              </Text>
            </View>
          </View>

          {/* Row 2: Shipping */}
          <View style={styles.detailRow}>
            <Truck size={14} color={colors.iconSecondary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Get it by</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{item.shipping}</Text>
          </View>

          {/* Row 3: Returns */}
          <View style={styles.detailRow}>
            <RotateCcw size={14} color={colors.iconSecondary} />
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Returns</Text>
            <Text style={[styles.detailValueSingle, { color: colors.textPrimary }]}>{item.returns}</Text>
          </View>
        </View>

        {/* Action Button */}
        {isBest ? (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <ShoppingCart size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Go to Store</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.backgroundSecondary }]}>
            <ShoppingCart size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={"Price Check"}
        onBack={() => navigation.goBack()}
      />

      {/* Read-Only Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        <Search size={18} color={colors.inputPlaceholder} />
        <Text style={[styles.searchText, { color: colors.textPrimary }]}>Sony WH-1000XM5</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={{ uri: PRODUCT.image }} style={[styles.productImage, { backgroundColor: colors.backgroundSecondary }]} />
          <View style={styles.productInfo}>
            <View style={styles.tagRow}>
              <Text style={[styles.tagText, { backgroundColor: colors.badgeBackground, color: colors.primary }]}>{PRODUCT.category}</Text>
              <View style={styles.ratingBox}>
                <Star
                  size={10}
                  color="#FBBF24"
                  fill="#FBBF24"
                  style={{ marginRight: 2 }}
                />
                <Text style={[styles.ratingText, { color: colors.warning }]}>{PRODUCT.rating}</Text>
              </View>
            </View>
            <Text style={[styles.productTitle, { color: colors.textPrimary }]}>{PRODUCT.title}</Text>
            <View style={styles.msrpRow}>
              <Text style={[styles.msrpLabel, { color: colors.textSecondary }]}>MSRP</Text>
              <Text style={[styles.msrpValue, { color: colors.textMuted }]}>{PRODUCT.msrp}</Text>
            </View>
          </View>
        </View>

        {/* AI Analysis Banner */}
        <View style={[styles.aiCard, { backgroundColor: colors.textPrimary }]}>
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconBox, { backgroundColor: colors.backgroundSecondary }]}>
              <BarChart2 size={16} color={colors.textMuted} />
            </View>
            <Text style={[styles.aiTitle, { color: colors.textMuted }]}>AI ANALYSIS</Text>
          </View>
          <Text style={[styles.aiText, { color: colors.textMuted }]}>
            <Text style={[styles.boldWhite, { color: colors.textInverse }]}>Amazon</Text> is your cheapest option
            today. However, <Text style={[styles.boldWhite, { color: colors.textInverse }]}>Best Buy</Text> has
            limited stock near you for immediate pickup.
          </Text>
        </View>

        {/* Store Offers */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Store Offers</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>4 stores found</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersScroll}>
          {OFFERS.map(renderStoreCard)}
          <View style={{ width: 16 }} />
        </ScrollView>

        {/* Technical Details */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Technical Details</Text>
        <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SPECS.map((spec, index) => (
            <View
              key={index}
              style={[
                styles.specRow,
                { borderBottomColor: colors.border },
                index === SPECS.length - 1 && { borderBottomWidth: 0 },
              ]}>
              <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{spec.label}</Text>
              <Text style={[styles.specValue, { color: colors.textPrimary }]}>{spec.value}</Text>
            </View>
          ))}

          <TouchableOpacity style={[styles.showSpecsBtn, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.showSpecsText, { color: colors.primary }]}>Show Full Specs</Text>
            <ChevronDown size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: FontFamily.bold,
  },

  // Search Bar
  searchContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchText: {
    marginLeft: 10,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  // Product Card
  productCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tagText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
  },
  productTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    lineHeight: 18,
  },
  msrpRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  msrpLabel: {
    fontSize: RFValue(9),
    marginRight: 4,
  },
  msrpValue: {
    fontSize: RFValue(9),
    textDecorationLine: "line-through",
  },

  // AI Card
  aiCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  aiIconBox: {
    padding: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  aiTitle: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  aiText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  boldWhite: {
    fontFamily: FontFamily.bold,
    textDecorationLine: "underline",
  },

  // Store Offers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  sectionSubtitle: {
    fontSize: RFValue(10),
  },
  offersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  offerCard: {
    borderRadius: 16,
    padding: 16,
    width: width * 0.7,
    marginRight: 12,
    borderWidth: 1,
    position: "relative",
  },
  offerCardBest: {
    borderWidth: 2,
  },
  bestPriceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestPriceText: {
    color: "#fff",
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },

  // Offer Content
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  storeLogoText: {
    color: "#fff",
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  storeName: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  storeType: {
    fontSize: RFValue(9),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: RFValue(22),
    fontFamily: FontFamily.bold,
    marginRight: 8,
  },
  oldPrice: {
    fontSize: RFValue(12),
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  taxNote: {
    fontSize: RFValue(8),
    marginBottom: 16,
  },

  // Grid Details
  detailsGrid: {
    marginBottom: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: RFValue(10),
    marginLeft: 6,
    width: 60,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  stockText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
  },
  detailValue: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginLeft: "auto",
    textAlign: "right",
  },
  detailValueSingle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginLeft: "auto",
  },

  // Buttons
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Specs
  specsCard: {
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  specLabel: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
  },
  specValue: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },
  showSpecsBtn: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  showSpecsText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    marginRight: 4,
  },
});

export default PriceCheckScreen;
