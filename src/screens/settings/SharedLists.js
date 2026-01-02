import React, {useState} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import {Search, MoreHorizontal, Plus, Check, Users} from "lucide-react-native";
import {ScrollView, Text} from "~components/Common"; // Assuming Text is here
import {RFValue} from "react-native-responsive-fontsize";
import {FontFamily} from "~theme/fonts";
import Header from "~components/Header";

// Mock Data
const LISTS_DATA = [
  {
    id: 1,
    title: "Weekly Groceries",
    category: "Groceries",
    updated: "Updated 2h ago",
    totalItems: 24,
    completedItems: 18,
    color: "#0ea5e9", // Blue
    isCompleted: false,
    members: [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    id: 2,
    title: "Apartment Essentials",
    category: "Home",
    updated: "Updated 1d ago",
    totalItems: 8,
    completedItems: 2,
    color: "#0ea5e9", // Blue
    isCompleted: false,
    showMenu: true, // Flag to show the mock menu
    members: [
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    id: 3,
    title: "Weekend BBQ",
    category: "Food",
    updated: "Updated 5d ago",
    totalItems: 15,
    completedItems: 15,
    color: "#ef4444", // Red
    isCompleted: true,
    members: [
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    ],
  },
];

const FilterTab = ({label, isActive}) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive && styles.filterTabActive]}>
    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProgressBar = ({completed, total, color}) => {
  const percentage = (completed / total) * 100;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressStats}>
          {completed}/{total} items
        </Text>
        <Text style={[styles.progressPercentage, {color: color}]}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${percentage}%`, backgroundColor: color},
          ]}
        />
      </View>
    </View>
  );
};

const AvatarStack = ({images}) => {
  return (
    <View style={styles.avatarStack}>
      {images.map((uri, index) => (
        <Image
          key={index}
          source={{uri}}
          style={[styles.avatar, {marginLeft: index === 0 ? 0 : -10}]}
        />
      ))}
    </View>
  );
};

const SharedListsScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Header
        variant="screen"
        title={"Shared Lists"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filtersRow}>
          <FilterTab label="All Lists" />
          <FilterTab label="Personal Lists" />
          <FilterTab label="Shared Lists" isActive />
        </View>

        {/* List Cards */}
        <View style={styles.cardsContainer}>
          {LISTS_DATA.map(item => (
            <View key={item.id} style={styles.card}>
              {/* Colored Left Border */}
              <View
                style={[styles.cardBorderStrip, {backgroundColor: item.color}]}
              />

              <View style={styles.cardContent}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.badge}>
                      <Users
                        size={10}
                        color="#0ea5e9"
                        style={{marginRight: 2}}
                      />
                      <Text style={styles.badgeText}>Shared</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <MoreHorizontal size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  {item.category} • {item.updated}
                </Text>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <ProgressBar
                    completed={item.completedItems}
                    total={item.totalItems}
                    color={item.isCompleted ? "#22c55e" : "#0ea5e9"}
                  />
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <AvatarStack images={item.members} />
                  {item.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Check
                        size={12}
                        color="#16a34a"
                        style={{marginRight: 4}}
                      />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Spacer for FAB */}
        <View style={{height: 80}} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // Light Gray Background
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterTabActive: {
    backgroundColor: "#111827", // Black
    borderColor: "#111827",
  },
  filterText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#6b7280",
  },
  filterTextActive: {
    color: "#ffffff",
  },

  // Card Styles
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  cardBorderStrip: {
    width: 6,
    height: "100%",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    position: "relative", // Context for absolute menu
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: RFValue(13), // ~16px
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
    color: "#0284c7",
  },
  subtitle: {
    fontSize: RFValue(9), // ~12px
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
    marginBottom: 16,
  },

  // Progress Bar
  progressSection: {
    marginBottom: 16,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressStats: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.medium,
    color: "#4b5563",
  },
  progressPercentage: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
  },
  track: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    paddingLeft: 4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: RFValue(9),
    fontFamily: FontFamily.bold,
    color: "#15803d",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0ea5e9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default SharedListsScreen;
