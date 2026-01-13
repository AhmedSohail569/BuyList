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
import {Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

const {width} = Dimensions.get("window");

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
  {label: "Noise Cancelling", value: "Industry Leading Active NC"},
  {label: "Battery Life", value: "30 Hours (NC On)"},
  {label: "Weight", value: "250g"},
  {label: "Bluetooth", value: "5.2 with LDAC"},
];

const PriceCheckScreen = ({navigation}) => {
  // --- Render Store Card ---
  const renderStoreCard = item => {
    const isBest = item.isBestPrice;

    return (
      <View
        key={item.id}
        style={[styles.offerCard, isBest && styles.offerCardBest]}>
        {/* Best Price Badge */}
        {isBest && (
          <View style={styles.bestPriceBadge}>
            <CheckCircle size={10} color="#fff" style={{marginRight: 4}} />
            <Text style={styles.bestPriceText}>Best Price</Text>
          </View>
        )}

        {/* Header: Logo & Name */}
        <View style={styles.offerHeader}>
          <View style={[styles.storeLogo, {backgroundColor: item.storeLogoBg}]}>
            <Text style={styles.storeLogoText}>{item.storeLogoText}</Text>
          </View>
          <View>
            <Text style={styles.storeName}>{item.store}</Text>
            <Text style={styles.storeType}>{item.type}</Text>
          </View>
        </View>

        {/* Price Section */}
        <View style={styles.priceRow}>
          <Text style={[styles.currentPrice, isBest && {color: "#22C55E"}]}>
            ${item.price.toFixed(2)}
          </Text>
          {item.oldPrice && (
            <Text style={styles.oldPrice}>${item.oldPrice.toFixed(2)}</Text>
          )}
        </View>
        <Text style={styles.taxNote}>Taxes calculated at checkout</Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Row 1: Stock */}
          <View style={styles.detailRow}>
            <CheckCircle size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Stock</Text>
            <View
              style={[
                styles.stockBadge,
                item.stockStatus === "In Stock"
                  ? styles.stockGreen
                  : styles.stockOrange,
              ]}>
              <Text
                style={[
                  styles.stockText,
                  item.stockStatus === "In Stock"
                    ? {color: "#166534"}
                    : {color: "#9A3412"},
                ]}>
                {item.stockStatus}
              </Text>
            </View>
          </View>

          {/* Row 2: Shipping */}
          <View style={styles.detailRow}>
            <Truck size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Get it by</Text>
            <Text style={styles.detailValue}>{item.shipping}</Text>
          </View>

          {/* Row 3: Returns */}
          <View style={styles.detailRow}>
            <RotateCcw size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Returns</Text>
            <Text style={styles.detailValueSingle}>{item.returns}</Text>
          </View>
        </View>

        {/* Action Button */}
        {isBest ? (
          <TouchableOpacity style={styles.primaryButton}>
            <ShoppingCart size={16} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.primaryButtonText}>Go to Store</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton}>
            <ShoppingCart size={18} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Price Check"}
        onBack={() => navigation.goBack()}
      />

      {/* Read-Only Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#9CA3AF" />
        <Text style={styles.searchText}>Sony WH-1000XM5</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Product Info Card */}
        <View style={styles.productCard}>
          <Image source={{uri: PRODUCT.image}} style={styles.productImage} />
          <View style={styles.productInfo}>
            <View style={styles.tagRow}>
              <Text style={styles.tagText}>{PRODUCT.category}</Text>
              <View style={styles.ratingBox}>
                <Star
                  size={10}
                  color="#FBBF24"
                  fill="#FBBF24"
                  style={{marginRight: 2}}
                />
                <Text style={styles.ratingText}>{PRODUCT.rating}</Text>
              </View>
            </View>
            <Text style={styles.productTitle}>{PRODUCT.title}</Text>
            <View style={styles.msrpRow}>
              <Text style={styles.msrpLabel}>MSRP</Text>
              <Text style={styles.msrpValue}>{PRODUCT.msrp}</Text>
            </View>
          </View>
        </View>

        {/* AI Analysis Banner */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <BarChart2 size={16} color="#9CA3AF" />
            </View>
            <Text style={styles.aiTitle}>AI ANALYSIS</Text>
          </View>
          <Text style={styles.aiText}>
            <Text style={styles.boldWhite}>Amazon</Text> is your cheapest option
            today. However, <Text style={styles.boldWhite}>Best Buy</Text> has
            limited stock near you for immediate pickup.
          </Text>
        </View>

        {/* Store Offers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Store Offers</Text>
          <Text style={styles.sectionSubtitle}>4 stores found</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.offersScroll}>
          {OFFERS.map(renderStoreCard)}
          <View style={{width: 16}} />
        </ScrollView>

        {/* Technical Details */}
        <Text style={styles.sectionTitle}>Technical Details</Text>
        <View style={styles.specsCard}>
          {SPECS.map((spec, index) => (
            <View
              key={index}
              style={[
                styles.specRow,
                index === SPECS.length - 1 && {borderBottomWidth: 0},
              ]}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.showSpecsBtn}>
            <Text style={styles.showSpecsText}>Show Full Specs</Text>
            <ChevronDown size={14} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16, // Adjust for SafeArea
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: RFValue(18),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },

  // Search Bar
  searchContainer: {
    marginHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchText: {
    marginLeft: 10,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#1F2937",
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  // Product Card
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
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
    color: "#0EA5E9",
    backgroundColor: "#E0F2FE",
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
    color: "#B45309",
  },
  productTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 4,
    lineHeight: 18,
  },
  msrpRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  msrpLabel: {
    fontSize: RFValue(9),
    color: "#6B7280",
    marginRight: 4,
  },
  msrpValue: {
    fontSize: RFValue(9),
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  // AI Card
  aiCard: {
    backgroundColor: "#111827", // Dark
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
    backgroundColor: "#374151",
    padding: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  aiTitle: {
    color: "#D1D5DB",
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
  },
  aiText: {
    color: "#D1D5DB",
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
  boldWhite: {
    color: "#FFFFFF",
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
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: RFValue(10),
    color: "#6B7280",
  },
  offersScroll: {
    marginHorizontal: -16, // Bleed to edge
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: width * 0.7, // Card Width
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6", // Default border
    position: "relative",
  },
  offerCardBest: {
    borderWidth: 2,
    borderColor: "#22C55E", // Green Border
    backgroundColor: "#FFFFFF",
  },
  bestPriceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
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
    color: "#111827",
  },
  storeType: {
    fontSize: RFValue(9),
    color: "#6B7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: RFValue(22),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginRight: 8,
  },
  oldPrice: {
    fontSize: RFValue(12),
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  taxNote: {
    fontSize: RFValue(8),
    color: "#9CA3AF",
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
    color: "#6B7280",
    marginLeft: 6,
    width: 60, // Fixed label width for alignment
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  stockGreen: {backgroundColor: "#DCFCE7"},
  stockOrange: {backgroundColor: "#FFEDD5"},
  stockText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
  },
  detailValue: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginLeft: "auto",
    textAlign: "right",
  },
  detailValueSingle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginLeft: "auto",
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#0EA5E9",
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
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Specs
  specsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  specLabel: {
    fontSize: RFValue(11),
    color: "#6B7280",
    fontFamily: FontFamily.regular,
  },
  specValue: {
    fontSize: RFValue(11),
    color: "#111827",
    fontFamily: FontFamily.bold,
  },
  showSpecsBtn: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  showSpecsText: {
    fontSize: RFValue(10),
    color: "#0EA5E9",
    fontFamily: FontFamily.bold,
    marginRight: 4,
  },
});

export default PriceCheckScreen;
