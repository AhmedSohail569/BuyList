import React, { useState, useCallback, memo } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import { MapPin, ArrowRight } from "lucide-react-native";
import { Text } from "~components/Common";
import { Images } from "~assets";
import { useTheme } from "~context/ThemeContext";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";

const StoreCard = ({ item, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.storeCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
    onPress={() => onPress(item.id)}
    activeOpacity={0.7}>
    <View style={[styles.storeImageContainer, { backgroundColor: colors.surfaceSecondary }]}>
      <Image source={item.image} style={styles.storeImage} />
      <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
        <Text style={styles.badgeText}>{item.badge}</Text>
      </View>
    </View>
    <View style={styles.storeInfo}>
      <Text style={[styles.storeName, { color: colors.textPrimary }]}>{item.name}</Text>
      <View style={styles.storeDetails}>
        <MapPin size={14} color={colors.iconMuted} />
        <Text style={[styles.storeDistance, { color: colors.textMuted }]}>{item.distance}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const MemoStoreCard = memo(StoreCard);

const NearbyStores = ({ navigation }) => {
  const { colors } = useTheme();
  const [stores] = useState([
    {
      id: 1,
      name: "Whole Foods",
      image: Images.storesPlaceholder,
      distance: "0.8 km",
      status: "Open",
      statusColor: "#10B981",
      badge: "High Stock",
      badgeColor: "#EF4444",
    },
    {
      id: 2,
      name: "Trader Joe's",
      image: Images.storesPlaceholder,
      distance: "1.2 km",
      status: "Closing soon",
      statusColor: "#F97316",
      badge: "Low Traffic",
      badgeColor: "#10B981",
    },
    {
      id: 3,
      name: "Good Market",
      image: Images.storesPlaceholder,
      distance: "2.5 km",
      status: "Open",
      statusColor: "#10B981",
      badge: "New",
      badgeColor: "#3B82F6",
    },
  ]);

  const handleMapPress = () => {
    // navigation.navigate("NearbyStoresMap");
  };

  const handleStorePress = storeId => {
    // navigation.navigate("StoreDetail", {storeId});
  };

  const renderStoreItem = useCallback(
    ({ item }) => (
      <MemoStoreCard item={item} onPress={handleStorePress} colors={colors} />
    ),
    [handleStorePress, colors],
  );

  const storeKeyExtractor = useCallback(item => item.id.toString(), []);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Nearby Stores</Text>
        <TouchableOpacity onPress={handleMapPress} activeOpacity={0.6}>
          <View style={styles.mapLink}>
            <Text style={[styles.mapText, { color: colors.primary }]}>Map </Text>
            <ArrowRight size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stores}
        renderItem={renderStoreItem}
        keyExtractor={storeKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.storesList}
        initialNumToRender={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  mapText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  storesList: {
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 2,
  },
  storeCard: {
    width: 180,
    marginRight: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeImageContainer: {
    position: "relative",
    width: "100%",
    height: 110,
  },
  storeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
  storeInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  storeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeDistance: {
    fontSize: 11,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: "auto",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default memo(NearbyStores);
