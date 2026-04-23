import { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Search,
  Shield,
} from "lucide-react-native";
import Header from "~components/Header";
import { ScrollView, Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { FontFamily } from "~theme/fonts";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllConnections } from "~redux/actions/circleActions";
import { useTheme } from "~context/ThemeContext";
import useScreenFetch from "~hooks/useScreenFetch";
import Avatar from "~components/Avatar";
import useTranslation from "~hooks/useTranslation";

const AllConnectionsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { 
    allConnections,
    connectionsLoading, 
  } = useSelector(state => state.circles);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all connections initially and on background-refresh
  const fetchFn = useCallback(() => {
    dispatch(fetchAllConnections());
  }, [dispatch]);
  
  useScreenFetch(fetchFn, allConnections.length > 0);

  // Filter and aggregate connections based on search query
  const filteredConnections = useMemo(() => {
    if (!Array.isArray(allConnections)) return [];

    // 1. Aggregate connections by User ID
    const aggregatedMap = {};

    allConnections.forEach(c => {
      const userId = c._id || c.id;
      if (!aggregatedMap[userId]) {
        aggregatedMap[userId] = {
          ...c,
          id: userId,
          associations: []
        };
      }
      
      // Add this circle/role association if it doesn't exist
      const associationExists = aggregatedMap[userId].associations.some(
        a => a.circleId === c.circleId
      );
      
      if (!associationExists) {
        aggregatedMap[userId].associations.push({
          circleId: c.circleId,
          circleName: c.circleName,
          circleColor: c.circleColor,
          role: c.role || "member"
        });
      }
    });

    const aggregatedList = Object.values(aggregatedMap);

    // 2. Filter based on search query
    if (!searchQuery.trim()) return aggregatedList;
    
    const query = searchQuery.toLowerCase().trim();
    return aggregatedList.filter(
      (c) =>
        (c.username || c.name || "").toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
    );
  }, [allConnections, searchQuery]);

  const renderConnectionItem = (item, isLast) => {
    const name = item.username || item.name || item.email || "User";
    const role = item.role ? (item.role.charAt(0).toUpperCase() + item.role.slice(1)) : "Member";
    const isOwner = item.role?.toLowerCase() === "owner";
    
    return (
      <View
        key={item.id || item._id}
        style={[
          styles.connectionRow,
          !isLast && [styles.separator, { borderBottomColor: colors.divider }],
        ]}>
        <View style={[
          item.circleColor && { 
            padding: 2, 
            borderWidth: 2, 
            borderColor: 'red',
            borderRadius: 24, // (40+4)/2
          }
        ]}>
          <Avatar image={item.profilePicture} name={name} size={40} colors={colors} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.nameText, { color: colors.textPrimary }]}>{name}</Text>
           {item.circleName && (
            <View style={[styles.circleBadge, { backgroundColor: item.circleColor ? `${item.circleColor}10` : colors.backgroundSecondary }]}>
              <Text style={[styles.circleNameText, { color: item.circleColor || colors.textMuted }]}>
                {item.circleName}
              </Text>
            </View>
          )}
          <View style={[
            styles.roleBadge, 
            { backgroundColor: isOwner ? colors.badgeBackground : colors.backgroundSecondary }
          ]}>
            {isOwner && (
              <Shield
                size={8}
                color={colors.primary}
                style={{ marginRight: 4 }}
                fill={colors.primary}
              />
            )}
            <Text style={[
              styles.roleText, 
              { color: isOwner ? colors.primary : colors.textSecondary }
            ]}>
              {role}
            </Text>
          </View>
          
         
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        variant="screen"
        title={t("all_connections_title")}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.iconMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder={t("manage_search_placeholder")}
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          {connectionsLoading && allConnections.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ padding: 20 }} />
          ) : filteredConnections.length === 0 ? (
            <Text style={[styles.emptyConnectionsText, { color: colors.textMuted }]}>
              {searchQuery.trim()
                ? `${t("manage_no_results")} "${searchQuery}"`
                : t("manage_no_connections")}
            </Text>
          ) : (
            filteredConnections.map((item, index) => {
              const name = item.username || item.name || item.email || "User";
              const primaryColor = item.associations?.[0]?.circleColor || item.circleColor;
              const isLast = index === filteredConnections.length - 1;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.connectionRow,
                    !isLast && [styles.separator, { borderBottomColor: colors.divider }],
                  ]}>
                  <View style={[
                    primaryColor && { 
                      padding: 2, 
                      borderWidth: 2, 
                      borderColor: primaryColor,
                      borderRadius: 24,
                    }
                  ]}>
                    <Avatar image={item.profilePicture} name={name} size={40} colors={colors} />
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={[styles.nameText, { color: colors.textPrimary }]}>{name}</Text>
                    
                    <View style={styles.associationsList}>
                      {item.associations.map((assoc, idx) => {
                        const role = assoc.role ? (assoc.role.charAt(0).toUpperCase() + assoc.role.slice(1)) : "Member";
                        const isOwner = assoc.role?.toLowerCase() === "owner";
                        const color = assoc.circleColor || colors.primary;

                        return (
                          <View key={assoc.circleId || idx} style={styles.associationItem}>
                            {assoc.circleName && (
                              <View style={[styles.circleBadge, { backgroundColor: `${color}15` }]}>
                                <Text style={[styles.circleNameText, { color: color }]}>
                                  {assoc.circleName}
                                </Text>
                              </View>
                            )}
                            
                            <View style={[
                              styles.roleBadge, 
                              { backgroundColor: isOwner ? colors.badgeBackground : colors.backgroundSecondary }
                            ]}>
                              {isOwner && (
                                <Shield
                                  size={8}
                                  color={colors.primary}
                                  style={{ marginRight: 4 }}
                                  fill={colors.primary}
                                />
                              )}
                              <Text style={[
                                styles.roleText, 
                                { color: isOwner ? colors.primary : colors.textSecondary }
                              ]}>
                                {role}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
  },
  listCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10
  },
  separator: {
    borderBottomWidth: 1,
  },
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  emptyConnectionsText: {
    textAlign: "center",
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    paddingVertical: 20,
  },
  circleBadge: {
    alignSelf: "flex-start",
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  circleNameText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.medium,
  },
  associationsList: {
    marginTop: 4,
  },
  associationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
});

export default AllConnectionsScreen;
