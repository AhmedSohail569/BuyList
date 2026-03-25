// CustomTabBar component for bottom navigation
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "./Common";
import { useTheme } from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";

const Tab = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const TAB_LABELS = {
    Home: t("tab_home"),
    Circle: t("tab_circle"),
    Lists: t("tab_lists"),
    Search: t("tab_search"),
    Settings: t("tab_settings"),
  };

  return (
    <View style={{ backgroundColor: colors.background }}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            shadowColor: colors.shadowColor,
            shadowOpacity: isDark ? 0.3 : 0.08,
            borderTopWidth: isDark ? 1 : 0,
            borderTopColor: colors.border,
          },
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const icons = {
            Home: isFocused ? "home" : "home-outline",
            Circle: isFocused ? "people" : "people-outline",
            Lists: isFocused ? "list" : "list-outline",
            Search: isFocused ? "search" : "search-outline",
            Settings: isFocused ? "settings" : "settings-outline",
          };

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}>
              <Icon
                name={icons[route.name]}
                size={RFValue(22)}
                color={isFocused ? colors.tabActive : colors.tabInactive}
              />
              <Text
                variant="small"
                style={[
                  styles.label,
                  { color: isFocused ? colors.tabActive : colors.tabInactive },
                ]}>
              {TAB_LABELS[route.name] || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: RFValue(78),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: RFValue(10),
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 12,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    marginTop: 4,
    fontSize: RFValue(10),
    fontWeight: "500",
  },
});

export default Tab;
