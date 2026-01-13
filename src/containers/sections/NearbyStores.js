import React, {useState} from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import {MapPin, ArrowRight} from "lucide-react-native";
import {Text} from "~components/Common";
import {Images} from "~assets";

const StoreCard = ({item, onPress}) => (
  <TouchableOpacity
    style={styles.storeCard}
    onPress={() => onPress(item.id)}
    activeOpacity={0.7}>
    <View style={styles.storeImageContainer}>
      <Image source={item.image} style={styles.storeImage} />
      <View style={[styles.badge, {backgroundColor: item.badgeColor}]}>
        <Text style={styles.badgeText}>{item.badge}</Text>
      </View>
    </View>
    <View style={styles.storeInfo}>
      <Text style={styles.storeName}>{item.name}</Text>
      <View style={styles.storeDetails}>
        <MapPin size={14} color="#6B7280" />
        <Text style={styles.storeDistance}>{item.distance}</Text>
        <View style={[styles.statusBadge, {backgroundColor: item.statusColor}]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const NearbyStores = ({navigation}) => {
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

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nearby Stores</Text>
        <TouchableOpacity onPress={handleMapPress} activeOpacity={0.6}>
          <View style={styles.mapLink}>
            <Text style={styles.mapText}>Map </Text>
            <ArrowRight size={14} color="#1E9DF1" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stores}
        renderItem={({item}) => (
          <StoreCard item={item} onPress={handleStorePress} />
        )}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={styles.storesList}
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
    fontSize: 17,
    fontWeight: "700",
    color: "#0F1419",
  },
  mapText: {
    fontSize: 12,
    color: "#1E9DF1",
    fontWeight: "600",
  },
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  storesList: {
    paddingRight: 20,
    paddingBottom: 10,
    paddingLeft: 2,
    // left: -20,
  },
  storeCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeImageContainer: {
    position: "relative",
    width: "100%",
    height: 110,
    backgroundColor: "#f3f4f6",
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
    fontWeight: "700",
    color: "#ffffff",
  },
  storeInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  storeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeDistance: {
    fontSize: 11,
    color: "#6B7280",
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

export default NearbyStores;
