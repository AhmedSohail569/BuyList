import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Link as LinkIcon,
  QrCode,
  Smartphone,
  Shield,
} from "lucide-react-native";
import { Menu } from "react-native-paper";
import Toast from "react-native-toast-message";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOwnedCircle,
  updateMemberRole,
  removeMemberFromCircle,
} from "~redux/actions/circleActions";
import { useAlert } from "~context/AlertContext";

// Helper function to get initials from a name
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "U";
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Helper function to check if profile picture is available
const hasProfilePicture = (profilePicture) => {
  return profilePicture && profilePicture.trim() !== "";
};

// Helper function to format role for display
const formatRole = (role) => {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Build connections list from ownedCircle data
const buildConnections = (ownedCircle) => {
  if (!ownedCircle) return [];

  const connections = [];

  // Always add owner first
  if (ownedCircle.owner) {
    connections.push({
      id: ownedCircle.owner._id || ownedCircle.owner.id,
      name: ownedCircle.owner.username || ownedCircle.owner.email || "Owner",
      role: "Owner",
      avatar: ownedCircle.owner.profilePicture,
      isOwner: true,
      badgeColor: "#eff6ff",
      textColor: "#0ea5e9",
    });
  }

  // Add members if they exist
  if (ownedCircle.members && Array.isArray(ownedCircle.members)) {
    ownedCircle.members.forEach((member) => {
      if (member.userId) {
        const role = formatRole(member.role);
        // Determine badge colors based on role
        let badgeColor = "#f3f4f6";
        let textColor = "#6b7280";
        if (role === "Editor") {
          badgeColor = "#ecfdf5";
          textColor = "#10b981";
        }

        connections.push({
          id: member.userId._id || member.userId.id,
          name: member.userId.username || member.userId.email || "Member",
          role,
          avatar: member.userId.profilePicture,
          isOwner: false,
          badgeColor,
          textColor,
        });
      }
    });
  }

  return connections;
};

// Avatar Component with initials fallback
const Avatar = ({ image, name, size = 40 }) => {
  const hasImage = hasProfilePicture(image);
  const initials = getInitials(name || "User");

  if (hasImage) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, marginRight: 12 }}>
        <Image
          source={{ uri: image }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#e0f2fe",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      }}>
      <Text
        style={{
          fontSize: RFValue(size * 0.35),
          color: "#0ea5e9",
          fontFamily: FontFamily.bold,
        }}>
        {initials}
      </Text>
    </View>
  );
};

const ManageConnectionsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { ownedCircle, loading } = useSelector(state => state.circles);
  const { showAlert, showError } = useAlert();
  const { tab } = route.params || {};
  const [activeTab, setActiveTab] = useState(tab || "Connections");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const isMenuDismissingRef = useRef(false);

  // Get circle ID
  const circleId = ownedCircle?._id || ownedCircle?.id;

  // Fetch owned circle on mount
  useEffect(() => {
    if (!ownedCircle) {
      dispatch(fetchOwnedCircle());
    }
  }, [dispatch, ownedCircle]);

  // Build connections from ownedCircle data
  const connections = useMemo(() => buildConnections(ownedCircle), [ownedCircle]);

  // Handle menu toggle with proper state management
  const handleMenuToggle = useCallback(
    (memberId) => {
      if (isMenuDismissingRef.current) {
        return;
      }
      setActiveMenuId(prev => (prev === memberId ? null : memberId));
    },
    [],
  );

  // Handle menu dismiss
  const handleMenuDismiss = useCallback(() => {
    isMenuDismissingRef.current = true;
    setActiveMenuId(null);
    setTimeout(() => {
      isMenuDismissingRef.current = false;
    }, 100);
  }, []);

  // Update member role
  const handleUpdateRole = useCallback(
    async (memberId, newRole) => {
      if (!circleId) {
        showError("Error", "Circle ID not found");
        return;
      }

      handleMenuDismiss();

      try {
        await dispatch(
          updateMemberRole({
            circleId,
            memberId,
            role: newRole.toLowerCase(),
          }),
        ).unwrap();

        Toast.show({
          type: "success",
          text1: "Role Updated",
          text2: `Member role updated to ${newRole}`,
        });

        // Refetch owned circle to update UI
        dispatch(fetchOwnedCircle());
      } catch (err) {
        showError("Error", err || "Failed to update member role");
      }
    },
    [circleId, dispatch, handleMenuDismiss, showError],
  );

  // Remove member from circle
  const handleRemoveMember = useCallback(
    (memberId, memberName) => {
      if (!circleId) {
        showError("Error", "Circle ID not found");
        return;
      }

      handleMenuDismiss();

      showAlert({
        title: "Remove Member",
        message: `Are you sure you want to remove "${memberName}" from the circle?`,
        type: "confirm",
        buttons: [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(
                  removeMemberFromCircle({
                    circleId,
                    memberId,
                  }),
                ).unwrap();

                Toast.show({
                  type: "success",
                  text1: "Member Removed",
                  text2: `${memberName} has been removed from the circle`,
                });

                // Refetch owned circle to update UI
                dispatch(fetchOwnedCircle());
              } catch (err) {
                showError("Error", err || "Failed to remove member");
              }
            },
          },
        ],
      });
    },
    [circleId, dispatch, handleMenuDismiss, showAlert, showError],
  );

  // --- Render Functions ---

  const renderConnectionItem = (item, isLast) => (
    <View
      key={item.id}
      style={[
        styles.connectionRow,
        !isLast && styles.separator,
        { zIndex: activeMenuId === item.id ? 10 : 1 },
      ]}>
      <Avatar image={item.avatar} name={item.name} size={40} />

      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.badgeColor }]}>
          {item.isOwner && (
            <Shield
              size={8}
              color={item.textColor}
              style={{ marginRight: 4 }}
              fill={item.textColor}
            />
          )}
          <Text style={[styles.roleText, { color: item.textColor }]}>
            {item.role}
          </Text>
        </View>
      </View>

      {!item.isOwner && (
        <Menu
          visible={activeMenuId === item.id}
          onDismiss={handleMenuDismiss}
          anchor={
            <TouchableOpacity
              hitSlop={10}
              onPress={() => handleMenuToggle(item.id)}
              disabled={loading}>
              <MoreHorizontal size={20} color="#9ca3af" />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}>
          {/* Show Editor option only if current role is not Editor */}
          {item.role.toLowerCase() !== "editor" && (
            <Menu.Item
              onPress={() => handleUpdateRole(item.id, "Editor")}
              title="Editor"
              titleStyle={styles.menuItemTitle}
            />
          )}
          {/* Show Viewer option only if current role is not Viewer */}
          {item.role.toLowerCase() !== "viewer" && (
            <Menu.Item
              onPress={() => handleUpdateRole(item.id, "Viewer")}
              title="Viewer"
              titleStyle={styles.menuItemTitle}
            />
          )}
          {/* Always show Remove option */}
          <Menu.Item
            onPress={() => handleRemoveMember(item.id, item.name)}
            title="Remove"
            titleStyle={styles.menuItemTitleDelete}
          />
        </Menu>
      )}
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
            Connections ({connections.length})
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
              <Search size={18} color="#9ca3af" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search connections..."
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
            </View>

            <View style={styles.listCard}>
              {connections.length === 0 ? (
                <Text style={styles.emptyConnectionsText}>
                  No connections yet. Invite members to get started.
                </Text>
              ) : (
                connections.map((item, index) =>
                  renderConnectionItem(
                    item,
                    index === connections.length - 1,
                  ),
                )
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
                <LinkIcon size={16} color="#9ca3af" style={{ marginRight: 8 }} />
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
                <QrCode size={24} color="#111827" style={{ marginBottom: 8 }} />
                <Text style={styles.actionText}>Show QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Smartphone
                  size={24}
                  color="#111827"
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.actionText}>From Contacts</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 4 },
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  menuContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 150,
  },
  menuItemTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#374151",
  },
  menuItemTitleDelete: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
});

export default ManageConnectionsScreen;
