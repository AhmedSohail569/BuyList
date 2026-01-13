import {View, StyleSheet, Image, TouchableOpacity} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import {Pencil} from "lucide-react-native";
import {RFValue} from "react-native-responsive-fontsize";
import {Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";
import {useNavigation} from "@react-navigation/native";

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

  return (
    <View style={[styles.container, {paddingTop: insets.top + RFValue(12)}]}>
      {/* 🏠 Home Header */}
      {variant === "home" && (
        <View style={styles.row}>
          <View style={styles.row}>
            <Image source={avatar} style={styles.avatar} />
            <View style={{marginLeft: 12}}>
              <Text variant="small" color="muted">
                {greeting}
              </Text>
              <Text variant="medium" style={styles.boldText}>
                {userName}
              </Text>
            </View>
          </View>

          {rightIcon && (
            <TouchableOpacity onPress={onRightPress}>
              <Icon name={rightIcon} size={25} color="#000" />
              {notificationBadge && <View style={styles.notifBadge} />}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 📄 Title Header */}
      {variant === "title" && (
        <View style={styles.row}>
          <View>
            <Text variant="sectionTitle" style={styles.title}>
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="bodySmall"
                color="muted"
                style={{fontSize: RFValue(10)}}>
                {subtitle}
              </Text>
            )}
          </View>

          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Icon name={rightIcon} size={20} color="#2F80ED" />
            </TouchableOpacity>
          )}

          {rightAction && rightAction}
        </View>
      )}

      {variant === "screen" && (
        <View style={styles.row}>
          <View style={{flexDirection: "row", alignItems: "center", gap: 10}}>
            {onBack && (
              <TouchableOpacity onPress={onBack}>
                <Icon name={"arrow-back"} size={25} color="#000" />
              </TouchableOpacity>
            )}
            <Text
              variant="sectionTitle"
              style={{
                fontSize: RFValue(16),
                fontFamily: FontFamily.bold,
              }}>
              {title}
            </Text>
          </View>

          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <Icon name={rightIcon} size={20} color="#2F80ED" />
            </TouchableOpacity>
          )}
          {rightAction && rightAction}
        </View>
      )}

      {showProfile && (
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 20,
            paddingHorizontal: 10,
            marginVertical: 10,
            borderRadius: 10,
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#F3F4F6",
          }}>
          <View
            style={{
              gap: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Image
              source={avatar}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
              }}
            />
            <View style={{justifyContent: "center"}}>
              <Text
                variant="body"
                style={{
                  fontFamily: FontFamily.bold,
                  fontSize: RFValue(11),
                  lineHeight: 20,
                }}>
                Samrana
              </Text>
              <Text
                variant="bodySmall"
                color="muted"
                style={{
                  fontSize: RFValue(8),
                  lineHeight: 20,
                }}>
                samrana@example.com
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "#FFFFFF",
              padding: 10,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 20,

              // iOS shadow
              shadowColor: "#000",
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.2,
              shadowRadius: 3,

              // Android shadow
              elevation: 4,
            }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("EditProfile")}>
            <Pencil size={20} color="#9E9E9E" />
          </TouchableOpacity>
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
    borderColor: "#FFFFFF",
    borderBottomColor: "#0000000D",
    backgroundColor: "#FFFFFF",
    // borderBottomLeftRadius: 24,
    // borderBottomRightRadius: 24,
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
    fontWeight: "600",
  },
  title: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  notifBadge: {
    position: "absolute",
    top: 2,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: "#EF4444",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
});

export default Header;
