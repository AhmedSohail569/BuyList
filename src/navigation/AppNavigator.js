import {createNativeStackNavigator} from "@react-navigation/native-stack";

import AppLayout from "~containers/layouts/AppLayout";

import TabNavigator from "./TabNavigator";
import SearchResultsScreen from "~screens/search/SearchResults";
import EditProfileScreen from "~screens/settings/EditProfile";
import NotificationsScreen from "~screens/settings/Notifications";
import SecurityScreen from "~screens/settings/AccountSecurity";
import CircleSettingsScreen from "~screens/settings/CircleSettings";
import SharedListsScreen from "~screens/settings/SharedLists";

import LegalScreen from "~screens/settings/Legal";

const Stack = createNativeStackNavigator();

export default () => {
  return (
    <AppLayout>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen
          name="AppTabNavigator"
          component={TabNavigator}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SearchResults"
          component={SearchResultsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AccountSecurity"
          component={SecurityScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CircleSettings"
          component={CircleSettingsScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SharedLists"
          component={SharedListsScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Legal"
          component={LegalScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </AppLayout>
  );
};
