import {useState, useEffect} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import {CircleDollarSignIcon} from "lucide-react-native";
import SubscriptionHeader from "~components/SubscriptionHeader";
import {Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {
  SettingsRow,
  SettingsSection,
} from "~containers/sections/SettingSections";
import SubscriptionModal from "~containers/modals/SubscriptionModal";
import {Images} from "~assets";

const STORAGE_KEY = "@subscription_draft"; // Key for Async Storage

const APP_OPTIONS = [
  {id: 1, label: "Netflix", icon: Images.netflix},
  {id: 2, label: "Spotify", icon: Images.spotify},
  {id: 3, label: "New York Times", icon: Images.newYorkTimes},
  {id: 4, label: "Wall Street Journal", icon: Images.wsj},
  {id: 5, label: "Hulu", icon: Images.hulu},
  {id: 6, label: "Apple", icon: Images.apple},
  {id: 7, label: "Amazon", icon: Images.amazon},
  {id: 8, label: "Chess.com", icon: Images.chessCom},
];

const CATEGORY_OPTIONS = [
  {id: 1, label: "Subscription", icon: Images.subscription},
  {id: 2, label: "Utility", icon: Images.utility},
  {id: 3, label: "Card Payment", icon: Images.cardPayment},
  {id: 4, label: "Loan", icon: Images.loan},
  {id: 5, label: "Rent", icon: Images.rent},
];

const FREQUENCY_OPTIONS = [
  {id: 1, label: "Weekly"},
  {id: 2, label: "Monthly"},
  {id: 3, label: "Annually"},
];

const REMINDER_OPTIONS = [
  {id: 1, label: "Same day"},
  {id: 2, label: "1 day before"},
  {id: 3, label: "2 days before"},
  {id: 4, label: "1 week before"},
];

const EditSubscriptionScreen = ({navigation}) => {
  const [isActive, setIsActive] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState({
    icon: Images.netflix,
    app: "Netflix",
    amount: "$50.00",
    category: "Loan",
    startDate: "Apr 12, 2025",
    frequency: "Weekly",
    reminder: "2 days before",
  });

  // --- MODAL STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: "list",
    title: "",
    field: "",
  });

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const savedData = JSON.parse(jsonValue);
          // Restore data
          setSubscriptionData(savedData.details);
          setIsActive(savedData.isActive);
          console.log("Data loaded from storage");
        }
      } catch (e) {
        console.error("Failed to load subscription data", e);
      }
    };

    loadData();
  }, []);

  // --- SAVE HANDLER ---
  const onSavePress = async () => {
    try {
      const dataToSave = {
        details: subscriptionData,
        isActive: isActive,
      };
      const jsonValue = JSON.stringify(dataToSave);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);

      Alert.alert("Success", "Subscription saved locally!");
      console.log("Data saved to storage");
      // navigation.goBack(); // Optional: Go back after save
    } catch (e) {
      Alert.alert("Error", "Failed to save data.");
      console.error("Failed to save subscription data", e);
    }
  };

  // --- MODAL HANDLERS ---
  const openModal = (field, type, title) => {
    setModalConfig({field, type, title});
    setModalVisible(true);
  };

  const handleModalSave = newValue => {
    // If we are changing the App, we also need to change the Icon
    if (modalConfig.field === "app") {
      const selectedApp = APP_OPTIONS.find(option => option.label === newValue);
      setSubscriptionData(prev => ({
        ...prev,
        app: newValue,
        icon: selectedApp ? selectedApp.icon : prev.icon, // Update icon if found
        deleted: false,
      }));
    } else {
      // For all other fields
      setSubscriptionData(prev => ({
        ...prev,
        [modalConfig.field]: newValue,
        deleted: false,
      }));
    }
  };

  const getModalData = () => {
    switch (modalConfig.field) {
      case "app":
        return APP_OPTIONS;
      case "category":
        return CATEGORY_OPTIONS;
      case "frequency":
        return FREQUENCY_OPTIONS;
      case "reminder":
        return REMINDER_OPTIONS;
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <SubscriptionHeader
        variant="subscription"
        title="Edit Subscription"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={subscriptionData?.deleted ? () => {} : onSavePress}>
            <Text
              style={[
                styles.saveText,
                subscriptionData?.deleted && {color: "#98A2B3"},
              ]}>
              Save
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Card: App Icon & Price */}
        <View style={styles.topCard}>
          <Image
            source={subscriptionData.icon || Images.noApp}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <View>
            <Text
              style={[
                styles.appName,
                subscriptionData?.deleted && {
                  fontFamily: FontFamily.graphik,
                  color: "#98A2B3",
                },
              ]}>
              {subscriptionData.app || "Choose an app"}
            </Text>
            <Text style={styles.appPrice}>
              {subscriptionData.amount || "$0.00"}
            </Text>
          </View>
        </View>

        {/* SECTION 1: Details */}
        <SettingsSection>
          <SettingsRow
            label="App"
            value={subscriptionData.app}
            type="select"
            onPress={() => openModal("app", "list", "App")}
          />
          <SettingsRow
            label="Amount"
            value={subscriptionData.amount}
            type="text"
            onPress={() => openModal("amount", "input", "Amount")}
          />
          <SettingsRow
            label="Category"
            value={subscriptionData.category}
            type="select"
            icon={CircleDollarSignIcon}
            onPress={() => openModal("category", "list", "Category")}
            isLast
          />
        </SettingsSection>

        {/* SECTION 2: Schedule */}
        <SettingsSection>
          <SettingsRow
            label="Start Date"
            value={subscriptionData.startDate}
            type="date"
            onPress={() => openModal("startDate", "date", "Start Date")}
          />
          <SettingsRow
            label="Frequency"
            value={subscriptionData.frequency}
            type="select"
            onPress={() => openModal("frequency", "list", "Frequency")}
          />
          <SettingsRow
            label="Remind Me"
            value={subscriptionData.reminder}
            type="select"
            onPress={() => openModal("reminder", "list", "Remind Me")}
          />
          <SettingsRow
            label="Active"
            type="toggle"
            toggleValue={isActive}
            onToggle={setIsActive}
            isLast
          />
        </SettingsSection>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={async () => {
            // Optional: Clear storage on delete
            await AsyncStorage.removeItem(STORAGE_KEY);
            setSubscriptionData({
              icon: Images.noApp,
              app: "Choose an App",
              amount: "$0.00",
              category: "Loan",
              startDate: "Apr 12, 2025",
              frequency: "Weekly",
              reminder: "2 days before",
              deleted: true,
            });
            Alert.alert("Deleted", "Draft cleared.");
          }}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      <SubscriptionModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleModalSave}
        type={modalConfig.type}
        title={modalConfig.title}
        data={getModalData()}
        initialValue={subscriptionData[modalConfig.field]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  saveText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.graphik_bold,
    color: "#002FFF", // Blue
  },

  // --- Top Card Styles ---
  topCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E6E8EB",
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: "#000",
  },
  appName: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 2,
  },
  appPrice: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#6B7280",
  },

  // --- Delete Button ---
  deleteButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E8EB",
  },
  deleteText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#EF4444", // Red
  },
});

export default EditSubscriptionScreen;
