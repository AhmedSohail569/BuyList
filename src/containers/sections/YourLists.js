import React, { useCallback, useMemo, memo } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";
import { useSelector } from "react-redux";
import { formatTimeAgo } from "~utils/time";
import Avatar from "~components/Avatar";
import useTranslation from "~hooks/useTranslation";

const MAX_LISTS = 3;
const MAX_COMPLETED_FILL = 2; // max completed lists allowed to fill up to MAX_LISTS

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

const getPriorityWeight = (priority) => {
  if (!priority) return 0;
  return priorityWeight[priority.toLowerCase()] || 0;
};

/**
 * Smart filter:
 * - Prefer uncompleted lists (progress.percentage < 100)
 * - Sort internally by priority (High > Medium > Low)
 * - If uncompleted count < MAX_LISTS, fill remaining slots with up to
 *   MAX_COMPLETED_FILL completed lists
 * - Total capped at MAX_LISTS
 */
const selectHomeLists = (lists) => {
  if (!Array.isArray(lists) || lists.length === 0) return [];

  const uncompleted = lists.filter((l) => (l.progress?.percentage ?? 0) < 100);
  const completed = lists.filter((l) => (l.progress?.percentage ?? 0) >= 100);

  // Sort uncompleted by priority (high to low), fallback to date descending
  uncompleted.sort((a, b) => {
    const diff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (diff !== 0) return diff;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  // Sort completed by priority (high to low), fallback to date descending
  completed.sort((a, b) => {
    const diff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (diff !== 0) return diff;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  if (uncompleted.length >= MAX_LISTS) {
    return uncompleted.slice(0, MAX_LISTS);
  }

  const slotsLeft = Math.min(MAX_LISTS - uncompleted.length, MAX_COMPLETED_FILL);
  return [...uncompleted, ...completed.slice(0, slotsLeft)];
};

// ──────────────────────────────────────────────────────────────────────────────
// ListCard
// ──────────────────────────────────────────────────────────────────────────────

const ListCard = ({ item, onPress, colors, t }) => {
  const progress = item.progress ?? { total: 0, purchased: 0, percentage: 0 };
  const members = item.members || item.sharedWith || [];

  return (
    <TouchableOpacity
      style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
      onPress={() => onPress(item.id || item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.listHeader}>
        <View style={styles.listTitleContainer}>
          <Text variant="body" style={[styles.listTitle, { color: colors.textPrimary }]}>
            {item.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.type === "shared" && (
              <>
                <Text
                  variant="caption"
                  style={[
                    styles.listSubtitle,
                    {
                      color: "#0ea5e9",
                      fontFamily: FontFamily.bold,
                    },
                  ]}>
                  Shared
                </Text>
                <Text variant="caption" color="muted" style={styles.listSubtitle}>
                  {" • "}
                </Text>
              </>
            )}
            {item.priority && item.priority !== "none" && (
              <>
                <Text
                  variant="caption"
                  style={[
                    styles.listSubtitle,
                    {
                      color:
                        item.priority === "high"
                          ? "#ef4444"
                          : item.priority === "medium"
                          ? "#ca8a04"
                          : "#16a34a",
                      fontFamily: FontFamily.bold,
                    },
                  ]}>
                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                </Text>
                <Text variant="caption" color="muted" style={styles.listSubtitle}>
                  {" • "}
                </Text>
              </>
            )}
            <Text variant="caption" color="muted" style={styles.listSubtitle}>
              {t("home_list_updated")} {formatTimeAgo(item.updatedAt || item.createdAt)}
            </Text>
          </View>
        </View>
        {/* Member Avatars */}
        {members.length > 0 && (
          <View style={styles.avatarStack}>
            {members.slice(0, 3).map((member, index) => {
              const uri = member.profilePicture || member.avatar;
              if (!uri) return null;
              return (
                <Image
                  key={member._id || member.id || index}
                  source={{ uri }}
                  style={[styles.avatar, { marginLeft: index > 0 ? -12 : 0, borderColor: colors.card }]}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={(progress.percentage ?? 0) / 100}
          color={colors.primary}
          style={[styles.progressBar, { backgroundColor: colors.progressTrack }]}
        />
      </View>

      {/* Stats Footer */}
      <View style={styles.statsContainer}>
        <Text variant="caption" color="muted" style={styles.statsText}>
          {progress.purchased}/{progress.total} {t("home_list_items")}
        </Text>
        <Text variant="caption" style={[styles.statsText, { color: colors.primary }]}>
          {progress.percentage}% {t("home_list_done")}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MemoListCard = memo(ListCard);

// ──────────────────────────────────────────────────────────────────────────────
// YourLists
// ──────────────────────────────────────────────────────────────────────────────

const YourLists = ({ navigation }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const allLists = useSelector((state) => state.lists.lists);

  // Smart-filtered lists — memoised to avoid recalculation on every render
  const lists = useMemo(() => selectHomeLists(allLists), [allLists]);

  const handleListPress = useCallback(
    (listId) => {
      navigation.navigate("ListDetails", { listId });
    },
    [navigation],
  );

  const handleViewAll = useCallback(() => {
    navigation.navigate("Lists");
  }, [navigation]);

  if (lists.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="sectionTitle" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t("home_your_lists")}
        </Text>
      </View>

      {lists.map((item) => (
        <MemoListCard
          key={item.id || item._id}
          item={item}
          onPress={handleListPress}
          colors={colors}
          t={t}
        />
      ))}

      <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll} activeOpacity={0.7}>
        <Text variant="bodySmall" color="muted" style={styles.viewAllText}>
          {t("home_view_all_lists")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginTop: 0,
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
