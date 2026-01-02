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
  iconColor = "#777",
}) => {
  const handlePress = () => {
    if (!editable && onPress) {
      Keyboard.dismiss();
      onPress();
    }
  };

  const Container = editable ? View : TouchableOpacity;

  return (
    <View style={[styles.wrapper, style]}>
      {title && <Text style={styles.title}>{title}</Text>}

      {type === 1 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color={iconColor}
            style={{marginLeft: 10}}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#777"
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            pointerEvents={editable ? "auto" : "none"}
          />
          {filterIcon && (
            <Icon
              name="funnel"
              size={20}
              color={"#38BAEF"}
              style={{position: "absolute", right: 15}}
            />
          )}
          <View style={styles.searchActions}>
            <View style={styles.divider} />
            <TouchableOpacity>
              <Mic size={20} color="#1E9DF1" />
            </TouchableOpacity>
            <TouchableOpacity>
              <ScanLine size={20} color="#0F1419" />
            </TouchableOpacity>
          </View>
        </Container>
      )}

      {type === 2 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items, brands..."
              placeholderTextColor="#9ca3af"
              editable={editable}
              pointerEvents={editable ? "auto" : "none"}
            />
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Mic size={22} color="#0ea5e9" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.scanButton]}>
            <ScanLine size={22} color="#1f2937" />
          </TouchableOpacity>
        </Container>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: RFValue(12),
    color: "#444",
    marginBottom: 6,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 30,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(13),
    color: "#000",
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
    backgroundColor: "#D1D5DB",
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
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e0f2fe", // Light blue bg for Mic
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#f3f4f6", // Light gray for Scan
  },
});

export default SearchBar;
