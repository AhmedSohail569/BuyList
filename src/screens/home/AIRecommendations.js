import {View, StyleSheet, TouchableOpacity, Image} from "react-native";
import {Sparkles} from "lucide-react-native";
import Header from "~components/Header"; // Assuming generic header available
import {ScrollView, Text} from "~components/Common";
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";

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
  const {colors} = useTheme();
  
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        variant="screen"
        title={
          <View style={{flexDirection: "row", alignItems: "center", gap: 5}}>
            <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>AI Recommendations</Text>
            <Sparkles
              size={16}
              color={colors.primary}
              fill={colors.primary}
              style={{marginLeft: 6}}
            />
          </View>
        }
        onBack={() => navigation.goBack()}
      />

      <ScrollView>
        {/* --- SECTION: For You --- */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>For You</Text>
        </View>

        <View style={styles.forYouContainer}>
          {FOR_YOU.map((item, index) => (
            <View key={index} style={[styles.forYouCard, {backgroundColor: colors.card, shadowColor: colors.shadowColor}]}>
              <Image source={{uri: item.image}} style={[styles.forYouImage, {backgroundColor: colors.backgroundSecondary}]} />
              <View style={styles.forYouContent}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}>
                  <Text style={[styles.forYouTitle, {color: colors.textPrimary}]}>{item.name}</Text>
                  <View style={[styles.tagBadge, {backgroundColor: colors.backgroundSecondary}]}>
                    <Text style={[styles.tagText, {color: colors.textSecondary}]}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={[styles.forYouDesc, {color: colors.primary}]} numberOfLines={2}>
                  {item.desc}
                </Text>
                <TouchableOpacity style={[styles.addListBtn, {backgroundColor: colors.textPrimary}]}>
                  <Text style={[styles.addListText, {color: colors.textInverse}]}>+ Add to List</Text>
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
  },

  // Section Headers
  sectionTitle: {
    fontSize: RFValue(14),
    fontFamily: FontFamily.bold,
  },
  sectionTitleRow: {
    marginVertical: RFValue(10),
  },

  // For You
  forYouContainer: {
    gap: 16,
  },
  forYouCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  forYouImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  forYouContent: {
    flex: 1,
    marginLeft: 12,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: RFValue(7),
    fontFamily: FontFamily.medium,
  },
  forYouTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  forYouDesc: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    fontStyle: "italic",
    lineHeight: 16,
    marginBottom: 8,
  },
  addListBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addListText: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
});

export default AIRecommendationsScreen;
