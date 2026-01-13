import React, {useState} from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  UserPlus,
  Link as LinkIcon,
  QrCode,
  Smartphone,
  Shield, // Using Shield for Owner icon logic if needed
} from "lucide-react-native";
import Header from "~components/Header";
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

const {width} = Dimensions.get("window");

// --- Mock Data ---
const CONNECTIONS_DATA = [
  {
    id: 1,
    name: "Samrana",
    role: "Owner",
    badgeColor: "#eff6ff",
    textColor: "#0ea5e9",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    isOwner: true,
  },
  {
    id: 2,
    name: "Alex",
    role: "Editor",
    badgeColor: "#ecfdf5",
    textColor: "#10b981", // Green
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
    isOwner: false,
    showMenu: true, // For screenshot replication
  },
  {
    id: 3,
    name: "Jordan",
    role: "Viewer",
    badgeColor: "#f3f4f6",
    textColor: "#6b7280", // Gray
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    isOwner: false,
  },
  {
    id: 4,
    name: "Casey",
    role: "Editor",
    badgeColor: "#ecfdf5",
    textColor: "#10b981",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
    isOwner: false,
  },
];

const ManageConnectionsScreen = ({navigation, route}) => {
  const {tab} = route.params || {};
  const [activeTab, setActiveTab] = useState(tab || "Connections"); // 'Connections' | 'Invite'
  const [activeMenuId, setActiveMenuId] = useState(2); // Default open on Alex to match screenshot

  // --- Render Functions ---

  const renderConnectionItem = (item, isLast) => (
    <View
      key={item.id}
      style={[
        styles.connectionRow,
        !isLast && styles.separator,
        {zIndex: activeMenuId === item.id ? 10 : 1},
      ]}>
      <Image source={{uri: item.avatar}} style={styles.avatar} />

      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <View style={[styles.roleBadge, {backgroundColor: item.badgeColor}]}>
          {item.isOwner && (
            <Shield
              size={8}
              color={item.textColor}
              style={{marginRight: 4}}
              fill={item.textColor}
            />
          )}
          <Text style={[styles.roleText, {color: item.textColor}]}>
            {item.role}
          </Text>
        </View>
      </View>

      {!item.isOwner && (
        <TouchableOpacity
          hitSlop={10}
          onPress={() =>
            setActiveMenuId(activeMenuId === item.id ? null : item.id)
          }>
          <MoreHorizontal size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}

      {/* Role Menu Dropdown */}
      {/* {activeMenuId === item.id && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity style={styles.menuItemActive}>
            <Text style={styles.menuTextBlue}>Editor</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Viewer</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuTextRed}>Remove</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Manage Connections"}
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Connections" && styles.activeTab]}
          onPress={() => setActiveTab("Connections")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "Connections" && styles.activeTabText,
            ]}>
            Connections (4)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Invite" && styles.activeTab]}
          onPress={() => setActiveTab("Invite")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "Invite" && styles.activeTabText,
            ]}>
            Invite People
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* --- CONNECTIONS TAB --- */}
        {activeTab === "Connections" && (
          <>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9ca3af" style={{marginRight: 8}} />
              <TextInput
                placeholder="Search connections..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
            </View>

            <View style={styles.listCard}>
              {CONNECTIONS_DATA.map((item, index) =>
                renderConnectionItem(
                  item,
                  index === CONNECTIONS_DATA.length - 1,
                ),
              )}
            </View>

            <Text style={styles.footerNote}>
              Only Owners can remove connections or change roles.
            </Text>
          </>
        )}

        {/* --- INVITE TAB --- */}
        {activeTab === "Invite" && (
          <>
            {/* Main Invite Card */}
            <View style={styles.inviteCard}>
              <View style={styles.inviteIconCircle}>
                <UserPlus size={24} color="#0ea5e9" />
                {/* <View style={styles.plusBadge}>
                  <Text
                    style={{fontSize: 10, color: "#fff", fontWeight: "bold"}}>
                    +
                  </Text>
                </View> */}
              </View>

              <Text style={styles.inviteTitle}>Invite to Family Home</Text>
              <Text style={styles.inviteDesc}>
                Share the link below to let others join your shopping circle.
                They will need the app installed.
              </Text>

              {/* Copy Link Box */}
              <View style={styles.copyBox}>
                <LinkIcon size={16} color="#9ca3af" style={{marginRight: 8}} />
                <Text style={styles.linkText} numberOfLines={1}>
                  buylist.app/join/fam-123
                </Text>
                <TouchableOpacity style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <QrCode size={24} color="#111827" style={{marginBottom: 8}} />
                <Text style={styles.actionText}>Show QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Smartphone
                  size={24}
                  color="#111827"
                  style={{marginBottom: 8}}
                />
                <Text style={styles.actionText}>From Contacts</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // Light background
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#0ea5e9",
  },
  tabText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#0ea5e9",
    fontFamily: FontFamily.bold,
  },

  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },

  // --- CONNECTIONS STYLES ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    color: "#111827",
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    position: "relative", // Context for dropdown
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb", // Very light divider
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: 35,
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    zIndex: 100,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemActive: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff",
  },
  menuText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#374151",
  },
  menuTextBlue: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#0ea5e9",
  },
  menuTextRed: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  footerNote: {
    textAlign: "center",
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    marginTop: 20,
  },

  // --- INVITE STYLES ---
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  inviteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eff6ff", // Light Blue
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  plusBadge: {
    position: "absolute",
    top: 14,
    right: 18,
    backgroundColor: "#0ea5e9",
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 8,
  },
  inviteDesc: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  copyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
    width: "100%",
  },
  linkText: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    color: "#4b5563",
  },
  copyButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#fff",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
});

export default ManageConnectionsScreen;
