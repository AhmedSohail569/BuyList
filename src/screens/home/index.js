import {useEffect, useState} from "react";
import {View, Text, TouchableOpacity, StyleSheet} from "react-native";
import {Plus, List, Users, TrendingDown} from "lucide-react-native";
import Header from "~components/Header";
import SearchBar from "~components/SearchBar";
import {ScrollView} from "~components/Common";
import NearbyStores from "~containers/sections/NearbyStores";
import YourLists from "~containers/sections/YourLists";
// import {fetchAIRecommendations} from "../services/geminiService.js";

const HomeTab = ({onQuickAction, navigation}) => {
  return (
    <View style={styles.container}>
      <Header
        variant="home"
        greeting="Good Morning,"
        userName="Samrana"
        avatar={{uri: "https://i.pravatar.cc/150"}}
        rightIcon="notifications-outline"
        notificationBadge
        onRightPress={() => navigation.navigate("Notifications")}
      />

      <SearchBar placeholder="Search products, categories..." />

      {/* <Header
        variant="title"
        title="Your Circle"
        subtitle="Shared shopping with your household"
        rightIcon="person-add-outline"
        onRightPress={() => navigation.navigate("AddMember")}
      /> */}
      {/* Top Bar */}

      <ScrollView>
        {/* Search Bar */}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ActionIcon
            id="create"
            icon={Plus}
            label="Create"
            color="#DBEAFE"
            iconColor="#2563EB"
            onPress={onQuickAction}
          />
          <ActionIcon
            id="lists"
            icon={List}
            label="Lists"
            color="#F3E8FF"
            iconColor="#9333EA"
            onPress={onQuickAction}
          />
          <ActionIcon
            id="circle"
            icon={Users}
            label="Circle"
            color="#FFEDD5"
            iconColor="#EA580C"
            onPress={onQuickAction}
          />
          <ActionIcon
            id="compare"
            icon={TrendingDown}
            label="Compare"
            color="#DCFCE7"
            iconColor="#16A34A"
            onPress={onQuickAction}
          />
        </View>

        <NearbyStores navigation={navigation} />

        <YourLists navigation={navigation} />

        {/* AI Recommendations */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>
                See All <ArrowRight size={12} color="#1E9DF1" />
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#1E9DF1" style={{marginVertical: 20}} />
          ) : (
            recommendations.map(item => (
              <View key={item.id} style={styles.recommendationCard}>
                <Image source={{uri: item.imageUrl}} style={styles.recImage} />
                <View style={styles.recInfo}>
                  <Text style={styles.recName}>{item.name}</Text>
                  <Text style={styles.recReason}>✨ {item.reason}</Text>
                  <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add to List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View> */}

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
};

const ActionIcon = ({id, icon: Icon, label, color, iconColor, onPress}) => (
  <TouchableOpacity style={styles.actionItem} onPress={() => onPress(id)}>
    <View style={[styles.actionIconCircle, {backgroundColor: color}]}>
      <Icon size={24} color={iconColor} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: "#f9fafb"},

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  actionItem: {alignItems: "center"},
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {fontSize: 12, fontWeight: "600", color: "#4B5563"},
});

export default HomeTab;
