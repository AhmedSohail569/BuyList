import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "./OnboardingNavigator";
import AppNavigator from "./AppNavigator";
import { getProfile } from "~redux/actions/profileActions";
import { getAccessToken } from "~utils";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, accessToken } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  console.log("user", user);

  // Fetch profile on app start if access token exists and when it becomes available
  useEffect(() => {
    const fetchProfileIfLoggedIn = async () => {
      try {
        // Check if we have access token in AsyncStorage
        const token = await getAccessToken();
        // Also check Redux state
        const hasToken = token || accessToken;

        // If we have a token but no user/profile, fetch profile
        if (hasToken && !user) {
          dispatch(getProfile());
        }
      } catch (error) {
        console.log("Error checking access token:", error);
      }
    };

    fetchProfileIfLoggedIn();
  }, [accessToken, user, dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {!user ? (
          <Stack.Screen
            name="OnboardingNavigator"
            component={OnboardingNavigator}
          />
        ) : (
          <Stack.Screen name="AppNavigator" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
