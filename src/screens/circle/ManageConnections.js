import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Clipboard,
  Share,
  ActivityIndicator,
  Linking,
  Platform,
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
import { getCircleInviteLink, getCircleInviteQR } from "~redux/actions/inviteActions";
import { useAlert } from "~context/AlertContext";
import { useTheme } from "~context/ThemeContext";
import useOnReconnect from "~hooks/useOnReconnect";
import useScreenFetch from "~hooks/useScreenFetch";
import Avatar from "~components/Avatar";
import QRCodeModal from "~components/QRCodeModal";
import useTranslation from "~hooks/useTranslation";

// Helper function to format role for display (ManageConnections-specific)
const formatRole = (role) => {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Build connections list from ownedCircle data with role-based badge colors
const buildConnections = (ownedCircle, colors) => {
  if (!ownedCircle) return [];
  const connections = [];
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
  if (ownedCircle.members && Array.isArray(ownedCircle.members)) {
    ownedCircle.members.forEach((member) => {
      if (member.userId) {
        const role = formatRole(member.role);
        const isEditor = role === "Editor";
        connections.push({
          id: member.userId._id || member.userId.id,
          name: member.userId.username || member.userId.email || "Member",
          role,
          avatar: member.userId.profilePicture,
          isOwner: false,
          badgeColor: isEditor ? colors.successLight : colors.backgroundSecondary,
          textColor: isEditor ? colors.success : colors.textSecondary,
        });
      }
    });
  }
  return connections;
};

const ManageConnectionsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { 
    ownedCircle, 
    loading, 
    inviteLink, 
    inviteLinkLoading,
    inviteQR,
    inviteQRLoading,
  } = useSelector(state => state.circles);
  const { showAlert, showError } = useAlert();
  const { tab } = route.params || {};
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(tab || "Connections");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const isMenuDismissingRef = useRef(false);

  // Get circle ID
  const circleId = ownedCircle?._id || ownedCircle?.id;

  // Fetch owned circle; background-refresh silently when navigating back
  const fetchFn = useCallback(() => dispatch(fetchOwnedCircle()), [dispatch]);
  useScreenFetch(fetchFn, !!ownedCircle);

  // Re-fetch circle data when internet reconnects
  useOnReconnect(() => {
    dispatch(fetchOwnedCircle());
  });

  // Generate invite link when switching to Invite tab
  useEffect(() => {
    if (activeTab === "Invite" && circleId && !inviteLink) {
      dispatch(getCircleInviteLink({ circleId }));
    }
  }, [activeTab, circleId, inviteLink, dispatch]);

  // Build connections from ownedCircle data
  const connections = useMemo(() => buildConnections(ownedCircle, colors), [ownedCircle, colors]);

  // Filter connections based on search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const query = searchQuery.toLowerCase().trim();
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.role && c.role.toLowerCase().includes(query))
    );
  }, [connections, searchQuery]);

  // ============================================
  // Invite Handlers
  // ============================================

  // Copy invite link to clipboard
  const handleCopyLink = useCallback(() => {
    if (!inviteLink) {
      Toast.show({
        type: "error",
        text1: "No Invite Link",
        text2: "Please wait while we generate your invite link",
      });
      return;
    }

    Clipboard.setString(inviteLink);
    Toast.show({
      type: "success",
      text1: t("manage_link_copied_title"),
      text2: t("manage_link_copied_desc"),
    });
  }, [inviteLink, t]);

  // Share invite link via native share sheet
  const handleShareLink = useCallback(async () => {
    if (!inviteLink) {
      Toast.show({
        type: "error",
        text1: t("manage_no_link_title"),
        text2: t("manage_no_link_desc"),
      });
      return;
    }

    try {
      const circleName = ownedCircle?.name || "our circle";
      await Share.share({
        message: `Join ${circleName} on Bagg! ${inviteLink}`,
        url: inviteLink,
        title: `Join ${circleName}`,
      });
    } catch (err) {
      console.error("Share error:", err);
      // User cancelled share, no need to show error
    }
  }, [inviteLink, ownedCircle]);

  // Share invite link via SMS (From Contacts)
  const handleShareViaSMS = useCallback(async () => {
    if (!inviteLink) {
      Toast.show({
        type: "error",
        text1: t("manage_no_link_title"),
        text2: t("manage_no_link_desc"),
      });
      return;
    }

    const circleName = ownedCircle?.name || "our circle";
    const message = `Join ${circleName} on Bagg! ${inviteLink}`;
    // Use ?body= for both iOS and Android in modern RN, but &body= is safer for some older iOS
    const separator = Platform.OS === "ios" ? "&" : "?";
    const url = `sms:${separator}body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to regular share if SMS is not available (e.g., iPad/Simulator)
        handleShareLink();
      }
    } catch (err) {
      console.error("Failed to open SMS:", err);
      handleShareLink(); // Fallback on error
    }
  }, [inviteLink, ownedCircle, handleShareLink]);

  // Show QR Code modal
  const handleShowQR = useCallback(() => {
    if (circleId) {
      if (!inviteQR) {
        dispatch(getCircleInviteQR({ circleId }));
      }
      setQRModalVisible(true);
    }
  }, [circleId, inviteQR, dispatch]);

  // ============================================
  // Member Management Handlers
  // ============================================

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
          text1: t("manage_role_updated_title"),
          text2: `${t("manage_role_updated_desc")} ${newRole}`,
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
        title: t("manage_remove_title"),
        message: `${t("manage_remove_message")} "${memberName}" ${t("manage_remove_from_circle")}`,
        type: "confirm",
        buttons: [
          { text: t("common_cancel"), style: "cancel" },
          {
            text: t("manage_action_remove"),
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
                  text1: t("manage_remove_success_title"),
                  text2: `${memberName} ${t("manage_remove_success_desc")}`,
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
              title={t("manage_role_editor")}
              titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
            />
          )}
          {/* Show Viewer option only if current role is not Viewer */}
          {item.role.toLowerCase() !== "viewer" && (
            <Menu.Item
              onPress={() => handleUpdateRole(item.id, "Viewer")}
              title={t("manage_role_viewer")}
              titleStyle={[styles.menuItemTitle, { color: colors.textPrimary }]}
            />
          )}
          {/* Always show Remove option */}
          <Menu.Item
            onPress={() => handleRemoveMember(item.id, item.name)}
            title={t("manage_action_remove")}
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
        title={t("manage_title")}
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
            {t("manage_tab_connections")} ({connections.length})
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
            {t("manage_tab_invite")}
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
                placeholder={t("manage_search_placeholder")}
                placeholderTextColor={colors.inputPlaceholder}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
              {filteredConnections.length === 0 ? (
                <Text style={[styles.emptyConnectionsText, { color: colors.textMuted }]}>
                  {searchQuery.trim()
                    ? `${t("manage_no_results")} "${searchQuery}"`
                    : t("manage_no_connections")}
                </Text>
              ) : (
                filteredConnections.map((item, index) =>
                  renderConnectionItem(
                    item,
                    index === filteredConnections.length - 1,
                  ),
                )
              )}
            </View>

            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              {t("manage_footer")}
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

              <Text style={[styles.inviteTitle, { color: colors.textPrimary }]}>
                {t("manage_tab_invite")} {ownedCircle?.name ? `${ownedCircle.name}` : ""}
              </Text>
              <Text style={[styles.inviteDesc, { color: colors.textSecondary }]}>
                {t("manage_invite_desc")}
              </Text>

              {/* Copy Link Box */}
              <View style={[styles.copyBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <LinkIcon size={16} color={colors.iconMuted} style={{ marginRight: 8 }} />
                {inviteLinkLoading ? (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <>
                    <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {inviteLink || t("manage_generating_link")}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.copyButton, { backgroundColor: colors.primary }]}
                      onPress={handleCopyLink}
                      disabled={!inviteLink}>
                      <Text style={styles.copyButtonText}>{t("manage_copy")}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Share Button */}
              {!inviteLinkLoading && inviteLink && (
                <TouchableOpacity 
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={handleShareLink}>
                  <Text style={styles.shareButtonText}>{t("manage_share_link")}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Bottom Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
                onPress={handleShowQR}
              >
                <QrCode size={24} color={colors.textPrimary} style={{ marginBottom: 8 }} />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>{t("manage_show_qr")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
                onPress={handleShareViaSMS}
              >
                <Smartphone
                  size={24}
                  color={colors.textPrimary}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.actionText, { color: colors.textPrimary }]}>{t("manage_contacts")}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <QRCodeModal 
        visible={isQRModalVisible}
        onClose={() => setQRModalVisible(false)}
        qrCodeUrl={inviteQR}
        loading={inviteQRLoading}
        circleName={ownedCircle?.name}
      />
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
    gap: 10
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
  shareButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: RFValue(11),
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
