import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";

const { width } = Dimensions.get("window");

const LegalSection = ({ title, content, colors }) => (
  <View style={styles.sectionContainer}>
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
    <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{content}</Text>
  </View>
);

const LegalScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("terms"); // 'terms' | 'privacy'

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={"Legal"}
        onBack={() => navigation.goBack()}
      />

      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "terms" && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab("terms")}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === "terms" && [styles.activeTabText, { color: colors.primary }],
            ]}>
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "privacy" && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab("privacy")}>
          <Text
            style={[
              styles.tabText,
              { color: colors.textMuted },
              activeTab === "privacy" && [styles.activeTabText, { color: colors.primary }],
            ]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {activeTab === "terms" ? (
          /* Terms of Service Content */
          <>
            <LegalSection
              title="1. Acceptance of Terms"
              content="By accessing and using BuyList, you accept and agree to be bound by the terms and provision of this agreement."
              colors={colors}
            />
            <LegalSection
              title="2. Use of Service"
              content="You agree to use this application only for lawful purposes. You are responsible for all content you post or share within the app."
              colors={colors}
            />
            <LegalSection
              title="3. User Accounts"
              content="You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account."
              colors={colors}
            />
            <LegalSection
              title="4. Modifications"
              content="BuyList reserves the right to modify these terms at any time. Your continued use of the app constitutes acceptance of those changes."
              colors={colors}
            />
          </>
        ) : (
          /* Privacy Policy Content */
          <>
            <LegalSection
              title="1. Information We Collect"
              content="We collect information you provide directly to us, such as when you create an account, create lists, or communicate with us."
              colors={colors}
            />
            <LegalSection
              title="2. How We Use Information"
              content="We use the information we collect to provide, maintain, and improve our services, including personalized AI recommendations."
              colors={colors}
            />
            <LegalSection
              title="3. Data Security"
              content="We implement reasonable security measures to protect your personal information from unauthorized access or disclosure."
              colors={colors}
            />
            <LegalSection
              title="4. Third-Party Services"
              content="We may share non-personal data with third-party partners for analytics and service improvements."
              colors={colors}
            />
          </>
        )}

        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last updated: October 2023</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    width: width / 2,
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
  },
  activeTabText: {},

  // Content Styles
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    lineHeight: RFValue(18),
  },
  lastUpdated: {
    textAlign: "center",
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    marginTop: 20,
    marginBottom: 20,
  },
});

export default LegalScreen;
