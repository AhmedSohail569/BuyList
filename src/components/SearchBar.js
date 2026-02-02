import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import {Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {Mic, ScanLine, Search} from "lucide-react-native";
import {useTheme} from "~context/ThemeContext";

const SearchBar = ({
  type = 1,
  title,
  placeholder = "Search...",
  editable = true,
  value,
  onChangeText,
  onPress,
  filterIcon = false,
  style,
  iconColor,
}) => {
  const {colors, isDark} = useTheme();
  const defaultIconColor = iconColor || colors.iconMuted;

  const handlePress = () => {
    if (!editable && onPress) {
      Keyboard.dismiss();
      onPress();
    }
  };

  const Container = editable ? View : TouchableOpacity;

  return (
    <View
      style={[
        styles.wrapper,
        {backgroundColor: colors.headerBackground},
        style,
      ]}>
      {title && (
        <Text style={[styles.title, {color: colors.textSecondary}]}>
          {title}
        </Text>
      )}

      {type === 1 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={[
            styles.searchContainer,
            {backgroundColor: isDark ? colors.surface : "#F3F4F6"},
          ]}>
          <Icon
            name="search"
            size={20}
            color={defaultIconColor}
            style={{marginLeft: 10}}
          />
          <TextInput
            style={[styles.searchInput, {color: colors.textPrimary}]}
            placeholder={placeholder}
            placeholderTextColor={colors.inputPlaceholder}
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            pointerEvents={editable ? "auto" : "none"}
          />
          {filterIcon && (
            <Icon
              name="funnel"
              size={20}
              color={colors.primary}
              style={{position: "absolute", right: 15}}
            />
          )}
          <View style={styles.searchActions}>
            <View style={[styles.divider, {backgroundColor: colors.border}]} />
            <TouchableOpacity>
              <Mic size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <ScanLine size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </Container>
      )}

      {type === 2 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.searchRow}>
          <View
            style={[
              styles.searchInputContainer,
              {backgroundColor: isDark ? colors.surface : "#f3f4f6"},
            ]}>
            <Search size={20} color={colors.iconMuted} />
            <TextInput
              style={[styles.searchInput, {color: colors.textPrimary}]}
              placeholder="Search items, brands..."
              placeholderTextColor={colors.inputPlaceholder}
              editable={editable}
              pointerEvents={editable ? "auto" : "none"}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {backgroundColor: isDark ? colors.surface : "#e0f2fe"},
            ]}>
            <Mic size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.scanButton,
              {backgroundColor: isDark ? colors.surface : "#f3f4f6"},
            ]}>
            <ScanLine size={22} color={colors.icon} />
          </TouchableOpacity>
        </Container>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: RFValue(12),
    marginBottom: 6,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(13),
  },
  searchActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    gap: 10,
  },
  divider: {
    width: 1,
    height: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {},
});

export default SearchBar;
