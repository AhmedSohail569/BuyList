import { useEffect, useRef, useCallback } from "react";
import { Linking } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import OnboardingNavigator from "./OnboardingNavigator";
import AppNavigator from "./AppNavigator";
import { getProfile } from "~redux/actions/profileActions";
import { getAccessToken } from "~utils";
import usePermissions from "~hooks/usePermissions";
import { PermissionsProvider } from "~context/PermissionsContext";
import { joinCircleViaInvite } from "~redux/actions/inviteActions";
import {
  parseInviteLink,
  storePendingInvite,
  getPendingInvite,
  clearPendingInvite,
  isInviteLink,
} from "~utils/deepLinking";

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

/**
 * React Navigation linking configuration.
 * Maps URL patterns to screen names so the library can parse incoming deep links.
 */
const linking = {
  prefixes: ["buylist://", "https://buylist.app", "https://www.buylist.app"],
  config: {
    screens: {
      AppNavigator: {
        screens: {
          AppTabNavigator: {
            screens: {
              Circle: "circle",
            },
          },
          ManageConnections: "manage-connections",
        },
      },
      // Invite paths are handled manually via Linking listener,
      // but we still declare them so NavigationContainer absorbs the URL.
      OnboardingNavigator: {
        screens: {
          GetStarted: "get-started",
        },
      },
    },
  },
  // We handle invite links manually — tell React Navigation to skip auto-nav
  // for invite URLs and let our handler take care of them.
  getStateFromPath: undefined,
};

const RootNavigator = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const processedUrlRef = useRef(null);

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

  // ── Deep link handler ────────────────────────────────────────────────────
  const handleDeepLink = useCallback(
    async (url) => {
      if (!url || !isInviteLink(url)) return;

      // Prevent processing the same URL twice (e.g. initial + listener)
      if (processedUrlRef.current === url) return;
      processedUrlRef.current = url;

      const inviteCode = parseInviteLink(url);
      if (!inviteCode) {
        Toast.show({
          type: "error",
          text1: "Invalid Invite Link",
          text2: "The invite link is not valid.",
        });
        return;
      }

      if (user) {
        // Authenticated → join circle immediately
        try {
          Toast.show({
            type: "info",
            text1: "Joining Circle...",
            text2: "Please wait",
          });

          await dispatch(joinCircleViaInvite({ inviteCode })).unwrap();

          Toast.show({
            type: "success",
            text1: "Joined Circle!",
            text2: "You have been added to the circle.",
          });

          // Navigate to circle screen
          if (navigationRef.isReady()) {
            navigationRef.navigate("AppTabNavigator", {
              screen: "Circle",
            });
          }
        } catch (err) {
          Toast.show({
            type: "error",
            text1: "Failed to Join",
            text2: typeof err === "string" ? err : "Could not join the circle.",
          });
        }
      } else {
        // Not authenticated → store invite for after login/signup
        await storePendingInvite(inviteCode);
        Toast.show({
          type: "info",
          text1: "Please Sign In",
          text2: "Sign in or create an account to join this circle.",
        });
      }
    },
    [user, dispatch],
  );

  // ── Listen for deep links (initial + while open) ─────────────────────────
  useEffect(() => {
    // 1. Handle the URL that opened the app (cold start)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink(initialUrl);
        }
      } catch {
        // Ignore — user will land on the normal screen
      }
    };
    handleInitialURL();

    // 2. Handle URLs that arrive while the app is already open (warm start)
    const sub = Linking.addEventListener("url", ({ url }) => {
      // Reset so the same link can be re-processed if opened again
      processedUrlRef.current = null;
      handleDeepLink(url);
    });

    return () => sub.remove();
  }, [handleDeepLink]);

  // ── Process pending invite after user logs in ────────────────────────────
  useEffect(() => {
    if (!user) return;

    const processPending = async () => {
      const pendingCode = await getPendingInvite();
      if (!pendingCode) return;

      await clearPendingInvite();

      try {
        Toast.show({
          type: "info",
          text1: "Joining Circle...",
          text2: "Processing your pending invite.",
        });

        await dispatch(joinCircleViaInvite({ inviteCode: pendingCode })).unwrap();

        Toast.show({
          type: "success",
          text1: "Joined Circle!",
          text2: "You have been added to the circle.",
        });

        if (navigationRef.isReady()) {
          navigationRef.navigate("AppTabNavigator", { screen: "Circle" });
        }
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Failed to Join",
          text2: typeof err === "string" ? err : "Could not join the circle.",
        });
      }
    };

    processPending();
  }, [user, dispatch]);

  return (
    <PermissionsProvider locationReady={locationReady}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
