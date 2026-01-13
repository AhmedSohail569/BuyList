import {
  View,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import {ChevronsUpDownIcon} from "lucide-react-native"; // Assuming you use lucide
import {Text} from "~components/Common"; // Your common Text component
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

export const SettingsSection = ({title, children, style}) => (
  <View style={[styles.section, style]}>
    {title && <Text style={styles.sectionHeader}>{title}</Text>}
    <View style={styles.cardContainer}>{children}</View>
  </View>
);

export const SettingsRow = ({
  label,
  value,
  onPress,
  isLast,
  type = "select", // 'select' | 'text' | 'toggle' | 'date'
  icon: Icon, // Optional icon to display next to the value
  toggleValue,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      style={styles.rowContainer}
      onPress={type === "toggle" ? onToggle : onPress}
      activeOpacity={type === "text" ? 1 : 0.7}
      disabled={type === "toggle"}>
      <View style={[styles.rowContent, !isLast && styles.separator]}>
        {/* Left Side: Label */}
        <Text style={styles.label}>{label}</Text>

        {/* Right Side: Value & Controls */}
        <View style={styles.rightContainer}>
          {/* Type: Date (Grey Pill) */}
          {type === "date" && (
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{value}</Text>
            </View>
          )}

          {/* Type: Toggle */}
          {type === "toggle" && (
            <Switch
              trackColor={{false: "#E5E7EB", true: "#22C55E"}}
              thumbColor={"#ffffff"}
              ios_backgroundColor="#E5E7EB"
              onValueChange={onToggle}
              value={toggleValue}
              style={styles.switch}
            />
          )}

          {/* Type: Select or Text */}
          {(type === "select" || type === "text") && (
            <View style={styles.valueWrapper}>
              {Icon && (
                <Icon size={14} color="#111827" style={{marginRight: 6}} />
              )}
              <Text style={styles.valueText}>{value}</Text>

              {/* Show Chevron for Selectors */}
              {type === "select" && (
                <View style={styles.chevronBox}>
                  <ChevronsUpDownIcon size={16} color="#636A79" />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 4,
    fontSize: RFValue(10), // Small caption style
    color: "#9CA3AF",
    fontFamily: FontFamily.graphik,
    textTransform: "uppercase",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E6E8EB",
  },
  rowContainer: {
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.graphik,
    color: "#636A79", // Gray-500
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.graphik,
    color: "#111827", // Gray-900
  },
  chevronBox: {
    marginLeft: 8,
    marginTop: 2,
  },
  datePill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#111827",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
  },
});
