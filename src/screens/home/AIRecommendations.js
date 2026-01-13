import {View, StyleSheet, TouchableOpacity, Image} from "react-native";
import {Sparkles} from "lucide-react-native";
import Header from "~components/Header"; // Assuming generic header available
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";

// --- MOCK DATA ---
const FOR_YOU = [
  {
    id: 1,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 2,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 3,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 4,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 5,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 6,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 7,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 8,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 9,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 10,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
  {
    id: 11,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80", // Placeholder
  },
  {
    id: 12,
    name: "Smart Air Fryer",
    tag: "Kitchen Appliance",
    desc: "Prepare healthier meals with less oil, controllable remotely via your smartphone.",
    image:
      "https://images.unsplash.com/photo-1585670149967-b4f4cb280d49?auto=format&fit=crop&w=100&q=80",
  },
];

const AIRecommendationsScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={
          <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            <Sparkles
              size={16}
              color="#0EA5E9"
              fill="#0EA5E9"
              style={{marginLeft: 6}}
            />
          </View>
        }
        onBack={() => navigation.goBack()}
      />

      <ScrollView>
        {/* --- SECTION: For You --- */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>For You</Text>
        </View>

        <View style={styles.forYouContainer}>
          {FOR_YOU.map((item, index) => (
            <View key={index} style={styles.forYouCard}>
              <Image source={{uri: item.image}} style={styles.forYouImage} />
              <View style={styles.forYouContent}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}>
                  <Text style={styles.forYouTitle}>{item.name}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.forYouDesc} numberOfLines={2}>
                  {item.desc}
                </Text>
                <TouchableOpacity style={styles.addListBtn}>
                  <Text style={styles.addListText}>+ Add to List</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  // Section Headers
  sectionTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  sectionTitleRow: {
    marginVertical: RFValue(10),
  },

  // For You
  forYouContainer: {
    gap: 16,
  },
  forYouCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  forYouImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  forYouContent: {
    flex: 1,
    marginLeft: 12,
  },
  tagBadge: {
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: RFValue(7),
    color: "#6B7280",
    fontFamily: FontFamily.medium,
  },
  forYouTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    color: "#111827",
    marginBottom: 4,
  },
  forYouDesc: {
    fontSize: RFValue(10),
    color: "#0EA5E9",
    fontFamily: FontFamily.regular,
    fontStyle: "italic",
    lineHeight: 16,
    marginBottom: 8,
  },
  addListBtn: {
    backgroundColor: "#111827",
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addListText: {
    color: "#FFF",
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
});

export default AIRecommendationsScreen;
