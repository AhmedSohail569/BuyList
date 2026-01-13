import React, {useState, useEffect} from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  KeyboardAvoidingView, // Import added
} from "react-native";
import {Search} from "lucide-react-native";
import {Text, TextInput as CustomInput} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker from "react-native-date-picker";
import {Images} from "~assets";

const {width, height} = Dimensions.get("window");

const SubscriptionModal = ({
  isVisible,
  onClose,
  onSave,
  type = "list",
  title,
  data = [],
  initialValue,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateValue, setDateValue] = useState(new Date());

  useEffect(() => {
    if (isVisible) {
      setSearchValue("");
      if (type === "input") {
        setInputValue(
          initialValue ? String(initialValue).replace("$", "") : "",
        );
      }
      if (type === "list") {
        setSelectedItem(initialValue);
      }
      if (type === "date") {
        let safeDate = new Date();
        if (initialValue) {
          const parsed = new Date(initialValue);
          if (!isNaN(parsed.getTime())) {
            safeDate = parsed;
          }
        }
        setDateValue(safeDate);
      }
    }
  }, [isVisible, initialValue, type]);

  const handleSave = () => {
    let finalValue;
    if (type === "list") finalValue = selectedItem;
    if (type === "input") finalValue = `$${inputValue}`;
    if (type === "date") {
      finalValue = dateValue.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    onSave(finalValue);
    onClose();
  };

  const filteredData =
    type === "list"
      ? data.filter(item =>
          item.label.toLowerCase().includes(searchValue.toLowerCase()),
        )
      : [];

  const renderContent = () => {
    switch (type) {
      case "input":
        return (
          <CustomInput
            type={1}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            leftIcon="dollar-sign"
            autoFocus={true} // Ensure keyboard opens
          />
        );

      case "date":
        return (
          <View style={styles.dateWrapper}>
            {Platform.OS === "ios" ? (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                onChange={(event, date) => date && setDateValue(date)}
                style={{width: "100%"}}
                themeVariant="light"
                textColor="#000000"
              />
            ) : (
              <DatePicker
                modal={false}
                open={true}
                date={dateValue}
                mode="date"
                onDateChange={setDateValue}
                style={{alignSelf: "center", width: width - 60}}
                dividerColor="#FFFFFF"
                theme="light"
                androidVariant="iosClone"
              />
            )}
          </View>
        );

      case "list":
      default:
        return (
          <>
            <View style={styles.searchBar}>
              <Search size={18} color="#9CA3AF" style={{marginRight: 8}} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                value={searchValue}
                onChangeText={setSearchValue}
              />
            </View>

            <ScrollView
              style={{maxHeight: 300}}
              showsVerticalScrollIndicator={false}>
              {filteredData.map(item => {
                const isSelected = selectedItem === item.label;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => setSelectedItem(item.label)}>
                    <View style={styles.listItemLeft}>
                      {item.icon && (
                        <Image
                          source={item.icon}
                          style={styles.appIcon}
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.listItemLabel}>{item.label}</Text>
                    </View>
                    {isSelected && (
                      <Image
                        source={Images.check_circle}
                        style={{width: 20, height: 20}}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        );
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Add KeyboardAvoidingView here to push content up */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{width: "100%"}}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleSave}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Dynamic Content */}
                <View style={styles.contentContainer}>{renderContent()}</View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    // Max height constraint ensures it doesn't take full screen on iPad/Large Android
    maxHeight: height * 0.9,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    height: 40, // Fixed height for alignment
  },
  title: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.medium,
    color: "#111827",
  },
  doneButton: {
    position: "absolute",
    right: 0,
    height: "100%",
    justifyContent: "center",
  },
  doneText: {
    color: "#002FFF",
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  contentContainer: {
    paddingBottom: 20,
  },

  // --- List Styles ---
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(12),
    color: "#111827",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemLabel: {
    fontSize: RFValue(12),
    color: "#111827",
    fontFamily: FontFamily.graphik,
  },
  appIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: "#000",
  },

  // --- Date Styles ---
  dateWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SubscriptionModal;
