import {createStackNavigator} from "@react-navigation/stack";

import HomeTab from "~screens/home";
import SearchTab from "~screens/search";
import SettingsTab from "~screens/settings";

const Stack = createStackNavigator();

export const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeTab"
        component={HomeTab}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export const SearchStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchTab"
        component={SearchTab}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};
