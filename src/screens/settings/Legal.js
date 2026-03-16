import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useTheme } from "~context/ThemeContext";

const { width } = Dimensions.get("window");

const LegalSection = ({ title, content, colors, isBold = false }) => (
  <View style={styles.sectionContainer}>
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
    <Text style={[styles.sectionContent, { color: colors.textSecondary }, isBold && { fontWeight: "bold", color: colors.textPrimary }]}>{content}</Text>
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
            Terms & Conditions
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
              title="1. Agreement to Terms"
              content="These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Clutch Services LLC (“Company”, “we”, “us”, or “our”), concerning your access to and use of the Bagg mobile application and any other media form, media channel, or mobile website related or connected thereto (collectively, the “App”)."
              colors={colors}
            />
            <LegalSection
              title="2. Intellectual Property Rights"
              content="Unless otherwise indicated, the App is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the App (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us."
              colors={colors}
            />
            <LegalSection
              title="3. User Content License"
              content="By posting, storing, or transmitting any content on or through the App (“User Content”), you hereby grant Clutch Services LLC a perpetual, unlimited, irrevocable, royalty-free, worldwide, non-exclusive, and transferable license to copy, publish, translate,modify, use, and create derivative works of your User Content for any purpose, including for the purpose of operating, developing, and improving the App. This includes the right to use anonymized and de-identified data for business analytics and commercial purposes."
              colors={colors}
            />
            <LegalSection
              title="4. Fees & Payment"
              content="While the App may currently be offered for free, we reserve the right to introduce fees, subscriptions, or premium features at any time at our sole discretion. You agree to be responsible for all such fees as they are disclosed to you. All payments are non-refundable."
              colors={colors}
            />
            <LegalSection
              title="5. Prohibited Activities"
              content="You may not access or use the App for any purpose other than that for which we make the App available. The App may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us."
              colors={colors}
            />
            <LegalSection
              title="6. Limitation of Liability (The LLC Shield)"
              content="IN NO EVENT WILL CLUTCH SERVICES LLC OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE APP, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING."
              isBold
              colors={colors}
            />
            <LegalSection
              title="7. Governing Law"
              content="These Terms shall be governed by and defined following the laws of the state where Clutch Services LLC is incorporated. You irrevocably consent that the courts of such state shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms."
              colors={colors}
            />
          </>
        ) : (
          /* Privacy Policy Content */
          <>
            <LegalSection
              title="1. Data Collection"
              content={"We collect \"Personal Information\" that you voluntarily provide to us when you register on the App, express an interest in obtaining information about us or our products, or otherwise when you contact us. This includes:\n\n• Personal Identifiers: Name, email address, phone number, and physical address.\n• Geolocation Data: We may request access or permission to track location-based information from your mobile device, either continuously or while you are using our App, to provide certain location-based services.\n• User Information: Any data, lists, or notes you input into the App."}
              colors={colors}
            />
            <LegalSection
              title="2. Use of Your Information"
              content={"We use the information we collect or receive:\n\n• To facilitate account creation and logon process.\n• To enable user-to-user sharing and communication.\n• To improve our App, services, and marketing efforts using anonymized data.\n• To respond to user inquiries and offer support."}
              colors={colors}
            />
            <LegalSection
              title="3. Sharing of Information"
              content={"We may process or share your data that we hold based on the following legal basis:\n\n• Consent: We may process your data if you have given us specific consent to use your personal information for a specific purpose (such as sharing a list via text).\n• Third-Party Service Providers: We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work."}
              colors={colors}
            />
            <LegalSection
              title="4. Data Retention"
              content="We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law."
              colors={colors}
            />
            <LegalSection
              title="5. Security of Your Information"
              content="We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable."
              colors={colors}
            />
            <LegalSection
              title="California & State-Specific Privacy Notice"
              content={"This section is required for compliance with the California Consumer Privacy Act (CCPA) and similar 2026 state laws (e.g., VA, CO, OR, TX).\n\n1. Notice at Collection\nWe collect categories of personal information including Identifiers, Geolocation Data, Commercial Information (grocery lists), and Inferences.\n\n2. Your Rights\nYou have the Right to Know, Right to Delete, Right to Correct, Right to Opt-Out, and Right to Limit use of Sensitive Personal Information.\n\n3. Exercise of Rights\nTo exercise these rights, please contact us at help@clutch.services. We will verify your request and respond within 45 days."}
              colors={colors}
            />
            <LegalSection
              title="Cookie & Tracking Technology Policy"
              content={"Clutch Services LLC uses tracking technologies to provide a seamless experience.\n\n1. Types of Trackers\n• Strictly Necessary: Essential for logging in and lists.\n• Analytics/Performance: Anonymized bug and usage tracking.\n• Functionality: Remembering preferences.\n\n2. Your Choices\nYou can manage tracking through the App's first-use choice or your device's \"Privacy\" settings."}
              colors={colors}
            />
          </>
        )}

        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>Last updated: March 2026</Text>
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
