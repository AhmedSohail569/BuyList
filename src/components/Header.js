import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { Pencil } from "lucide-react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "~components/Common";
import { FontFamily } from "~theme/fonts";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTheme } from "~context/ThemeContext";
import { getInitials } from "~utils/display";

const Header = ({
  variant = "title",

  // Common
  rightIcon,
  onRightPress,
  onBack,

  // Home variant
  userName,
  greeting,
  avatar,

  // Title variant
  title,
  subtitle,

  // Profile variant
  showProfile = false,
  rightAction,

  // Badge
  notificationBadge = false,

  // Components
  showTabs,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { user } = useSelector(state => state.auth);
  const { profile } = useSelector(state => state.profile);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + RFValue(12),
          backgroundColor: colors.headerBackground,
          borderColor: colors.headerBackground,
          borderBottomColor: colors.headerBorder,
        },
      ]}>
      {/* 🏠 Home Header */}
      {variant === "home" && (
        <View style={styles.row}>
          <View style={styles.row}>
            {avatar?.uri ? (
              <Image source={avatar} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  { backgroundColor: colors.primaryLight },
                ]}>
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: colors.primary },
                  ]}>
                  {getInitials(userName)}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text variant="small" color="muted">
                {greeting}
              </Text>
              <Text
                variant="medium"
                style={[styles.boldText, { color: colors.textPrimary, fontSize: RFValue(12) }]}>
                {userName}
              </Text>
            </View>
          </View>

          {rightIcon && (
            <TouchableOpacity onPress={onRightPress}>
              <Icon name={rightIcon} size={25} color={colors.icon} />
              {notificationBadge && (
                <View
                  style={[
                    styles.notifBadge,
                    {
                      backgroundColor: colors.notificationBadge,
                      borderColor: colors.headerBackground,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 📄 Title Header */}
      {variant === "title" && (
        <View style={styles.row}>
          <View>
            <Text
              variant="sectionTitle"
              style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="bodySmall"
                color="muted"
                style={{ fontSize: RFValue(10) }}>
                {subtitle}
              </Text>
            )}
          </View>

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={[
                styles.iconButton,
                { backgroundColor: isDark ? colors.surface : "#F2F6FF" },
              ]}>
              <Icon name={rightIcon} size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {rightAction && rightAction}
        </View>
      )}

      {variant === "screen" && (
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {onBack && (
              <TouchableOpacity onPress={onBack}>
                <Icon name={"arrow-back"} size={25} color={colors.icon} />
              </TouchableOpacity>
            )}
            <Text
              variant="sectionTitle"
              style={{
                fontSize: RFValue(16),
                fontFamily: FontFamily.bold,
                color: colors.textPrimary,
              }}>
              {title}
            </Text>
          </View>

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={[
                styles.iconButton,
                { backgroundColor: isDark ? colors.surface : "#F2F6FF" },
              ]}>
              <Icon name={rightIcon} size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {rightAction && rightAction}
        </View>
      )}

      {showProfile && (
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.profileCardBackground,
              borderColor: colors.profileCardBorder,
            },
          ]}>
          <View style={styles.profileRow}>
            {profile?.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                style={[
                  styles.profileAvatar,
                  { backgroundColor: colors.avatarBackground },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.profileAvatar,
                  styles.avatarFallback,
                  { backgroundColor: colors.primaryLight },
                ]}>
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: colors.primary },
                  ]}>
                  {getInitials(profile?.username || user?.username)}
                </Text>
              </View>
            )}
            <View style={{ justifyContent: "center" }}>
              <Text
                variant="body"
                style={{
                  fontFamily: FontFamily.bold,
                  fontSize: RFValue(11),
                  lineHeight: 20,
                  color: colors.textPrimary,
                }}>
                {profile?.username || user?.username || "User"}
              </Text>
              <Text
                variant="bodySmall"
                color="muted"
                style={{
                  fontSize: RFValue(8),
                  lineHeight: 20,
                }}>
                {profile?.email || user?.email || "email@example.com"}
              </Text>
            </View>
          </View>
          {/* <TouchableOpacity
            style={[
              styles.editButton,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.shadowColor,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EditProfile")}>
            <Pencil size={20} color={colors.iconMuted} />
          </TouchableOpacity> */}
        </View>
      )}

      {showTabs && showTabs}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderWidth: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  boldText: {
    fontWeight: "800",
  },
  title: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  profileCard: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  profileRow: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
  editButton: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default Header;
