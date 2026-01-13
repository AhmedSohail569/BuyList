import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView as ReactScrollView,
} from "react-native";
import {
  Settings,
  MapPin,
  Pencil,
  ShoppingBag,
  UserPlus,
  Share2,
  QrCode,
  ChevronRight,
} from "lucide-react-native";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import Header from "~components/Header";

// --- Mock Data ---
const CONNECTIONS = [
  {
    id: 1,
    name: "Samrana",
    role: "Owner",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    isOnline: true,
  },
  {
    id: 2,
    name: "Alex",
    role: "Editor",
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 3,
    name: "Jordan",
    role: "Viewer",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 4,
    name: "Casey",
    role: "Editor",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
  },
];

const SHARED_LISTS = [
  {
    id: 1,
    title: "Weekly Groceries",
    progress: 75,
    updated: "Updated 2m ago",
    avatars: [CONNECTIONS[1].image, CONNECTIONS[2].image],
  },
  {
    id: 2,
    title: "Weekend BBQ",
    progress: 17,
    updated: "Updated 1h ago",
    avatars: [CONNECTIONS[1].image, CONNECTIONS[3].image],
  },
];

const ACTIVITY = [
  {
    id: 1,
    user: "Alex",
    userAvatar: CONNECTIONS[1].image,
    action: "added 3 items to",
    target: "Weekly Groceries",
    time: "2 min ago",
  },
  {
    id: 2,
    user: "Casey",
    userAvatar: CONNECTIONS[3].image,
    action: "marked 5 items purchased in",
    target: "Weekly Groceries",
    time: "15 min ago",
  },
  {
    id: 3,
    user: "Jordan",
    userAvatar: CONNECTIONS[2].image,
    action: "joined the circle",
    target: "",
    time: "11:20 AM",
  },
];

// --- Sub Components ---

const AvatarStack = ({images, size = 24, limit = 3}) => {
  return (
    <View style={styles.avatarStack}>
      {images.slice(0, limit).map((uri, index) => (
        <Image
          key={index}
          source={{uri}}
          style={[
            styles.stackAvatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -8,
              zIndex: limit - index,
            },
          ]}
        />
      ))}
      {/* Fake "+1" badge for the Family Card */}
      {limit === 3 && images.length >= 2 && (
        // Logic tweaked just to match screenshot visual exactly
        <View style={[styles.plusOneBadge, {marginLeft: -8, zIndex: 0}]}>
          <Text style={styles.plusOneText}>+1</Text>
        </View>
      )}
    </View>
  );
};

const ProgressBar = ({percentage}) => (
  <View style={styles.progressContainer}>
    <View style={styles.track}>
      <View style={[styles.fill, {width: `${percentage}%`}]} />
    </View>
    <Text style={styles.progressText}>{percentage}%</Text>
  </View>
);

const CircleTab = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Header
        variant="title"
        title={"Your Circle"}
        subtitle={"Shared shopping with your household"}
        rightAction={
          <TouchableOpacity style={styles.addUserButton}>
            <UserPlus size={20} color="#0ea5e9" />
          </TouchableOpacity>
        }
      />
      {/* Top Header Area */}
      {/* <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Your Circle</Text>
          <Text style={styles.screenSubtitle}>
            Shared shopping with your household
          </Text>
        </View>
        <TouchableOpacity style={styles.addUserButton}>
          <UserPlus size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View> */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Family Home Card */}
        <View style={styles.familyCard}>
          {/* Decorative Corner */}
          <View style={styles.decorativeCorner} />

          <View style={styles.familyHeaderRow}>
            <View style={styles.iconBg}>
              <ShoppingBag size={20} color="#0ea5e9" />
            </View>
            <View style={styles.familyTitleContainer}>
              <Text style={styles.familyTitle}>Family Home</Text>
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerText}>Owner</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsIcon}
              onPress={() => navigation.navigate("CircleSettings")}>
              <Settings size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.addressRow}>
            <MapPin size={16} color="#0ea5e9" style={{marginRight: 6}} />
            <Text style={styles.addressText}>
              123 Maple Street, Springfield
            </Text>
            <TouchableOpacity style={{marginLeft: "auto"}}>
              <Pencil size={14} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.familyFooter}>
            <AvatarStack
              images={[
                CONNECTIONS[0].image,
                CONNECTIONS[1].image,
                CONNECTIONS[2].image,
              ]}
              size={32}
            />
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => navigation.navigate("ManageConnections")} // Assuming route name
            >
              <Text style={styles.manageBtnText}>Manage Circle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connections Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Connections</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("ManageConnections")}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={14} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        <ReactScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.connectionsScroll}>
          {CONNECTIONS.map(user => (
            <View key={user.id} style={styles.connectionItem}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{uri: user.image}}
                  style={styles.connectionAvatar}
                />
                {user.isOnline && <View style={styles.onlineDot} />}
              </View>
              <Text style={styles.connectionName}>{user.name}</Text>
              <Text style={styles.connectionRole}>{user.role}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.inviteItem}
            onPress={() =>
              navigation.navigate("ManageConnections", {tab: "Invite"})
            }>
            <View style={styles.inviteCircle}>
              <UserPlus size={20} color="#9ca3af" />
            </View>
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        </ReactScrollView>

        {/* Shared Lists Section */}
        <Text style={styles.sectionHeader}>Shared Lists</Text>
        <View style={styles.listsContainer}>
          {SHARED_LISTS.map(list => (
            <View key={list.id} style={styles.listCard}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{list.title}</Text>
                <View style={styles.syncedBadge}>
                  <Text style={styles.syncedText}>Synced</Text>
                </View>
              </View>
              <ProgressBar percentage={list.progress} />
              <View style={styles.listFooter}>
                <View style={styles.listMeta}>
                  <AvatarStack images={list.avatars} size={20} limit={2} />
                  <Text style={styles.listUpdated}>{list.updated}</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewListText}>View List</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity Section */}
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {ACTIVITY.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                index !== 0 && styles.activityBorder,
              ]}>
              <Image
                source={{uri: item.userAvatar}}
                style={styles.activityAvatar}
              />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{item.user} </Text>
                  {item.action}{" "}
                  {item.target ? (
                    <Text style={styles.activityTarget}>{item.target}</Text>
                  ) : null}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Grow Your Circle Banner */}
        <View style={styles.growBanner}>
          <View style={styles.growHeader}>
            <View>
              <Text style={styles.growTitle}>Grow your Circle</Text>
              <Text style={styles.growSubtitle}>
                Anyone you invite can help add or manage lists.
              </Text>
            </View>
            <View style={styles.growIconBox}>
              <UserPlus size={20} color="#ffffff" />
            </View>
          </View>
          <View style={styles.growActions}>
            <TouchableOpacity style={styles.inviteLinkBtn}>
              <Share2 size={16} color="#0ea5e9" style={{marginRight: 8}} />
              <Text style={styles.inviteLinkText}>Invite via Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrCodeBtn}>
              <QrCode size={16} color="#ffffff" style={{marginRight: 8}} />
              <Text style={styles.qrCodeText}>QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  addUserButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  scrollContent: {
    // paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Family Card
  familyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCorner: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    backgroundColor: "#f0f9ff", // Light Blue
    borderBottomLeftRadius: 120,
  },
  familyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  familyTitleContainer: {
    flex: 1,
  },
  familyTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 4,
  },
  ownerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ownerText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },
  settingsIcon: {
    marginTop: -40,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
  },
  familyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  manageBtnText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackAvatar: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  plusOneBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  plusOneText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
  },

  // Connections
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 12, // Default for non-row headers
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
    marginRight: 2,
  },
  connectionsScroll: {
    marginBottom: 24,
    flexGrow: 0,
  },
  connectionItem: {
    alignItems: "center",
    marginRight: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  connectionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0ea5e9",
    borderWidth: 2,
    borderColor: "#fff",
  },
  connectionName: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 2,
  },
  connectionRole: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  inviteItem: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inviteCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  inviteText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },

  // Shared Lists
  listsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  listCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  syncedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncedText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#16a34a",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
  },
  fill: {
    height: 6,
    backgroundColor: "#0ea5e9",
    borderRadius: 3,
  },
  progressText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
    width: 30,
    textAlign: "right",
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listUpdated: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  viewListText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },

  // Activity
  activityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  activityRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  activityBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 2,
  },
  activityUser: {
    fontFamily: FontFamily.bold,
    fontSize: RFValue(10),
    color: "#111827",
  },
  activityTarget: {
    color: "#0ea5e9",
    fontFamily: FontFamily.medium,
    fontSize: RFValue(10),
  },
  activityTime: {
    fontSize: RFValue(9),
    color: "#9ca3af",
  },

  // Grow Banner
  growBanner: {
    backgroundColor: "#3B82F6", // Blue
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  growHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  growTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#fff",
    marginBottom: 4,
  },
  growSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "85%",
  },
  growIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  growActions: {
    flexDirection: "row",
    gap: 12,
  },
  inviteLinkBtn: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  inviteLinkText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#0ea5e9",
  },
  qrCodeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  qrCodeText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#fff",
  },
});

export default CircleTab;
