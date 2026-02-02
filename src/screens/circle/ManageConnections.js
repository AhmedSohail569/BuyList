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
import { useTheme } from "~context/ThemeContext";

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
const buildConnections = (ownedCircle, colors) => {
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
      badgeColor: colors.badgeBackground,
      textColor: colors.primary,
    });
  }

  // Add members if they exist
  if (ownedCircle.members && Array.isArray(ownedCircle.members)) {
    ownedCircle.members.forEach((member) => {
      if (member.userId) {
        const role = formatRole(member.role);
        // Determine badge colors based on role
        let badgeColor = colors.backgroundSecondary;
        let textColor = colors.textSecondary;
        if (role === "Editor") {
          badgeColor = colors.successLight;
          textColor = colors.success;
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
const Avatar = ({ image, name, size = 40, colors }) => {
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
        backgroundColor: colors.badgeBackground,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      }}>
      <Text
        style={{
          fontSize: RFValue(size * 0.35),
          color: colors.primary,
          fontFamily: FontFamily.bold,
        }}>
        {initials}
      </Text>
    </View>
  );
};

const ManageConnectionsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { colors } = useTheme();
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
  const connections = useMemo(() => buildConnections(ownedCircle, colors), [ownedCircle, colors]);

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
        !isLast && [styles.separator, { borderBottomColor: colors.divider }],
        { zIndex: activeMenuId === item.id ? 10 : 1 },
      ]}>
      <Avatar image={item.avatar} name={item.name} size={40} colors={colors} />

      <View style={styles.infoContainer}>
        <Text style={[styles.nameText, { color: colors.textPrimary }]}>{item.name}</Text>
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
              <MoreHorizontal size={20} color={colors.iconMuted} />
            </TouchableOpacity>
          }
          contentStyle={[styles.menuContent, { backgroundColor: colors.card }]}>
          {/* Show Editor option only if current role is not Editor */}
          {item.role.toLowerCase() !== "editor" && (
            <Menu.Item
              onPress={() => handleUpdateRole(item.id, "Editor")}
              title="Editor"
              titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
            />
          )}
          {/* Show Viewer option only if current role is not Viewer */}
          {item.role.toLowerCase() !== "viewer" && (
            <Menu.Item
              onPress={() => handleUpdateRole(item.id, "Viewer")}
              title="Viewer"
              titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={"Manage Connections"}
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Connections" && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab("Connections")}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === "Connections" && [styles.activeTabText, { color: colors.primary }],
            ]}>
            Connections ({connections.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Invite" && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab("Invite")}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === "Invite" && [styles.activeTabText, { color: colors.primary }],
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
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={18} color={colors.iconMuted} style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search connections..."
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>

            <View style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
              {connections.length === 0 ? (
                <Text style={[styles.emptyConnectionsText, { color: colors.textMuted }]}>
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

            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              Only Owners can remove connections or change roles.
            </Text>
          </>
        )}

        {/* --- INVITE TAB --- */}
        {activeTab === "Invite" && (
          <>
            {/* Main Invite Card */}
            <View style={[styles.inviteCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
              <View style={[styles.inviteIconCircle, { backgroundColor: colors.badgeBackground }]}>
                <UserPlus size={24} color={colors.primary} />
              </View>

              <Text style={[styles.inviteTitle, { color: colors.textPrimary }]}>Invite to Family Home</Text>
              <Text style={[styles.inviteDesc, { color: colors.textSecondary }]}>
                Share the link below to let others join your shopping circle.
                They will need the app installed.
              </Text>

              {/* Copy Link Box */}
              <View style={[styles.copyBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <LinkIcon size={16} color={colors.iconMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
                  buylist.app/join/fam-123
                </Text>
                <TouchableOpacity style={[styles.copyButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
                <QrCode size={24} color={colors.textPrimary} style={{ marginBottom: 8 }} />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>Show QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
                <Smartphone
                  size={24}
                  color={colors.textPrimary}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>From Contacts</Text>
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
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
  },
  activeTabText: {
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
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
  },
  listCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  separator: {
    borderBottomWidth: 1,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
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
  emptyConnectionsText: {
    textAlign: "center",
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    paddingVertical: 20,
  },
  footerNote: {
    textAlign: "center",
    fontSize: RFValue(9),
    fontFamily: FontFamily.regular,
    marginTop: 20,
  },

  // --- INVITE STYLES ---
  inviteCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  inviteTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  inviteDesc: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  copyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
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
  },
  copyButton: {
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
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  menuContent: {
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 150,
  },
  menuItemTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  menuItemTitleDelete: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#ef4444",
  },
});

export default ManageConnectionsScreen;
