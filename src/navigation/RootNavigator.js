import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "./OnboardingNavigator";
import AppNavigator from "./AppNavigator";
import { getProfile } from "~redux/actions/profileActions";
import { getAccessToken } from "~utils";
import usePermissions from "~hooks/usePermissions";
import { PermissionsProvider } from "~context/PermissionsContext";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, accessToken } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // ── Sequential permission flow ───────────────────────────────────────────
  // Runs notification flow first, then unlocks location permission gate.
  const { locationReady } = usePermissions();

  console.log("user", user);

  // Fetch profile on app start if access token exists and when it becomes available
  useEffect(() => {
    const fetchProfileIfLoggedIn = async () => {
      try {
        // Check if we have access token in AsyncStorage
        const token = await getAccessToken();
        console.log('token=>', token)
        // Also check Redux state
        const hasToken = token || accessToken;
console.log('hasToken=>', hasToken)
console.log('user=>', user)
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
    <PermissionsProvider locationReady={locationReady}>
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
    </PermissionsProvider>
  );
};

export default RootNavigator;
