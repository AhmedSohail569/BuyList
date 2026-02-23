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
  const { user, accessToken } = useSelector((state) => state.auth);

  console.log("user", user);
  const dispatch = useDispatch();

  // Sequential permission flow: notifications first, then location
  const { locationReady } = usePermissions();

  // Fetch profile on app start if user has a token but no profile loaded
  useEffect(() => {
    const fetchProfileIfLoggedIn = async () => {
      try {
        const token = await getAccessToken();
        const hasToken = token || accessToken;

        if (hasToken && !user) {
          dispatch(getProfile());
        }
      } catch {
        // Token check failed — user will remain on onboarding
      }
    };

    fetchProfileIfLoggedIn();
  }, [accessToken, user, dispatch]);

  return (
    <PermissionsProvider locationReady={locationReady}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="OnboardingNavigator" component={OnboardingNavigator} />
          ) : (
            <Stack.Screen name="AppNavigator" component={AppNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PermissionsProvider>
  );
};

export default RootNavigator;
