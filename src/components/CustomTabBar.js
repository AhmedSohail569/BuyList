import React from "react";
import {View, TouchableOpacity, StyleSheet} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import {RFValue} from "react-native-responsive-fontsize";
import {Text} from "./Common";

const Tab = ({state, descriptors, navigation}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const icons = {
            Home: isFocused ? "home" : "home-outline",
            Circle: isFocused ? "people" : "people-outline",
            Lists: isFocused ? "list" : "list-outline",
            Search: isFocused ? "search" : "search-outline",
            Settings: isFocused ? "settings" : "settings-outline",
          };

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}>
              <Icon
                name={icons[route.name]}
                size={RFValue(22)}
                color={isFocused ? "#2F80ED" : "#9CA3AF"}
              />
              <Text
                variant="small"
                style={[
                  styles.label,
                  {color: isFocused ? "#2F80ED" : "#9CA3AF"},
                ]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: RFValue(78),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: RFValue(10),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: -4},
    shadowRadius: 12,
    elevation: 12,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    marginTop: 4,
    fontSize: RFValue(10),
    fontWeight: "500",
  },
});

export default Tab;
