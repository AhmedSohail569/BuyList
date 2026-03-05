import React, { useState, useCallback, memo } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";

const ListCard = ({ item, onPress, colors, isDark }) => (
  <TouchableOpacity
    style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
    onPress={() => onPress(item.id)}
    activeOpacity={0.7}>
    <View style={styles.listHeader}>
      <View style={styles.listTitleContainer}>
        <Text variant="body" style={[styles.listTitle, { color: colors.textPrimary }]}>
          {item.name}
        </Text>
        <Text variant="caption" color="muted" style={styles.listSubtitle}>
          Updated {item.updatedTime}
        </Text>
      </View>
      {/* Avatars */}
      <View style={styles.avatarsContainer}>
        {item.members && item.members.length > 0 && (
          <View style={styles.avatarStack}>
            {item.members.map((member, index) => (
              <Image
                key={member.id}
                source={{ uri: member.avatar }}
                style={[styles.avatar, { marginLeft: index > 0 ? -12 : 0, borderColor: colors.card }]}
              />
            ))}
          </View>
        )}
      </View>
    </View>

    {/* Progress Bar */}
    <View style={styles.progressContainer}>
      <ProgressBar
        progress={item.progress / 100}
        color={colors.primary}
        style={[styles.progressBar, { backgroundColor: colors.progressTrack }]}
      />
    </View>

    {/* Stats Footer */}
    <View style={styles.statsContainer}>
      <Text variant="caption" color="muted" style={styles.statsText}>
        {item.completedItems}/{item.totalItems} items
      </Text>
      <Text variant="caption" style={[styles.statsText, { color: colors.primary }]}>
        {item.progress}% Done
      </Text>
    </View>
  </TouchableOpacity>
);

const MemoListCard = memo(ListCard);

const YourLists = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [lists] = useState([
    {
      id: 1,
      name: "Weekly Groceries",
      updatedTime: "2h ago",
      totalItems: 18,
      completedItems: 12,
      progress: 65,
      members: [
        { id: 1, avatar: "https://i.pravatar.cc/150?u=user1" },
        { id: 2, avatar: "https://i.pravatar.cc/150?u=user2" },
      ],
    },
    {
      id: 2,
      name: "Weekend Shopping",
      updatedTime: "1h ago",
      totalItems: 24,
      completedItems: 16,
      progress: 67,
      members: [
        { id: 1, avatar: "https://i.pravatar.cc/150?u=user1" },
        { id: 3, avatar: "https://i.pravatar.cc/150?u=user3" },
      ],
    },
    {
      id: 3,
      name: "Pantry Refill",
      updatedTime: "3h ago",
      totalItems: 15,
      completedItems: 10,
      progress: 67,
      members: [
        { id: 1, avatar: "https://i.pravatar.cc/150?u=user1" },
        { id: 2, avatar: "https://i.pravatar.cc/150?u=user2" },
      ],
    },
  ]);

  const handleListPress = listId => {
    // navigation.navigate("ListDetail", {listId});
  };

  const handleViewAllLists = () => {
    navigation.navigate("Lists");
  };

  const renderListItem = useCallback(
    ({ item }) => (
      <MemoListCard item={item} onPress={handleListPress} colors={colors} isDark={isDark} />
    ),
    [handleListPress, colors, isDark],
  );

  const listKeyExtractor = useCallback(item => item.id.toString(), []);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="sectionTitle" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Your Lists
        </Text>
      </View>

      <FlatList
        data={lists}
        renderItem={renderListItem}
        keyExtractor={listKeyExtractor}
        scrollEnabled={false}
        contentContainerStyle={styles.listsList}
        initialNumToRender={3}
        removeClippedSubviews={false}
      />

      {/* View All Lists Button */}
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={handleViewAllLists}
        activeOpacity={0.7}>
        <Text variant="bodySmall" color="muted" style={styles.viewAllText}>
          View All Lists
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: RFValue(13),
    fontFamily: FontFamily.bold,
  },
  listsList: {
    paddingBottom: 0,
    marginHorizontal: 2,
  },
  listCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  listTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  listTitle: {
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 11,
  },
  avatarsContainer: {
    justifyContent: "flex-end",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsText: {
    fontSize: 11,
  },
  viewAllButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    textAlign: "center",
    fontFamily: FontFamily.medium,
  },
});

export default memo(YourLists);
