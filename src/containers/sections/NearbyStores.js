import React, { useCallback, memo, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import { MapPin, ArrowRight, Star, Clock } from "lucide-react-native";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useSelector } from "react-redux";
import { calculateDistance, formatDistance } from "~utils";
import useTranslation from "~hooks/useTranslation";

const StoreCard = ({ item, onPress, colors, userLat, userLng, distanceUnit }) => {
  const rating = item.rating ?? 0;
  
  // Rating color logic: Green for high (>= 4.0), Red for low (< 3.0), Amber for middle
  const getRatingColor = (r) => {
    if (r >= 4.0) return colors.success;
    if (r < 3.0) return colors.error;
    return "#F59E0B"; // Amber
  };

  const getRatingBg = (r) => {
    if (r >= 4.0) return colors.badgeBackground;
    if (r < 3.0) return colors.errorLight;
    return "#FEF3C7"; // Amber light
  };

  const ratingColor = getRatingColor(rating);
  const ratingBg = getRatingBg(rating);

  // Calculate distance
  const storeLat = item.location?.lat;
  const storeLng = item.location?.lng;
  const distanceKm =
    userLat != null &&
    userLng != null &&
    storeLat != null &&
    storeLng != null
      ? calculateDistance(userLat, userLng, storeLat, storeLng)
      : null;
  const distanceText = distanceKm != null ? formatDistance(distanceKm, distanceUnit) : "";

  return (
    <TouchableOpacity
      style={[styles.storeCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
      onPress={() => onPress(item.placeId)}
      activeOpacity={0.7}>
      <View style={[styles.storeImageContainer, { backgroundColor: colors.surfaceSecondary }]}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.storeImage} />
        ) : (
          <View style={styles.placeholderContainer}>
            <MapPin size={32} color={colors.iconMuted} />
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: ratingBg }]}>
          <Star size={10} color={ratingColor} fill={ratingColor} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: ratingColor }]}>{rating}</Text>
        </View>
      </View>
      <View style={styles.storeInfo}>
        <Text style={[styles.storeName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.storeDetails}>
          <MapPin size={12} color={colors.iconMuted} />
          <Text style={[styles.storeDistance, { color: colors.textMuted }]}>{distanceText || "Nearby"}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? colors.badgeBackground : colors.errorLight }]}>
            <Clock size={10} color={item.isOpen ? colors.success : colors.error} style={{ marginRight: 2 }} />
            <Text style={[styles.statusText, { color: item.isOpen ? colors.success : colors.error }]}>
              {item.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MemoStoreCard = memo(StoreCard);

const NearbyStores = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { localResults } = useSelector((state) => state.search);
  const { latitude, longitude } = useSelector((state) => state.location);
  const { distanceUnit } = useSelector((state) => state.settings);

  const handleMapPress = () => {
    navigation.navigate("SearchResults", {
     activeTab: "Local Stores",
     query: 'Store'
    });
  };

  const handleStorePress = (placeId) => {
    // navigation.navigate("StoreDetail", { placeId });
  };

  const renderStoreItem = useCallback(
    ({ item }) => (
      <MemoStoreCard 
        item={item} 
        onPress={handleStorePress} 
        colors={colors} 
        userLat={latitude} 
        userLng={longitude} 
        distanceUnit={distanceUnit}
      />
    ),
    [handleStorePress, colors, latitude, longitude, distanceUnit],
  );

  const sortedLocalResults = useMemo(() => {
    if (!localResults || localResults.length === 0) return [];

    return [...localResults].sort((a, b) => {
      const aLat = a.location?.lat;
      const aLng = a.location?.lng;
      const bLat = b.location?.lat;
      const bLng = b.location?.lng;

      const distA =
        latitude != null && longitude != null && aLat != null && aLng != null
          ? calculateDistance(latitude, longitude, aLat, aLng)
          : Infinity;

      const distB =
        latitude != null && longitude != null && bLat != null && bLng != null
          ? calculateDistance(latitude, longitude, bLat, bLng)
          : Infinity;

      return (distA !== null ? distA : Infinity) - (distB !== null ? distB : Infinity);
    });
  }, [localResults, latitude, longitude]);

  const storeKeyExtractor = useCallback((item, index) => item.placeId || index.toString(), []);

  if (!sortedLocalResults || sortedLocalResults.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("home_nearby_stores")}</Text>
        <TouchableOpacity onPress={handleMapPress} activeOpacity={0.6}>
          <View style={styles.mapLink}>
            <Text style={[styles.mapText, { color: colors.primary }]}>{t("home_nearby_see_all")} </Text>
            <ArrowRight size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedLocalResults.slice(0, 5)}
        renderItem={renderStoreItem}
        keyExtractor={storeKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.storesList}
        initialNumToRender={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 16,
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
    paddingLeft: 16,
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
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
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
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default memo(NearbyStores);
