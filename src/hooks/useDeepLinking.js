/**
 * useDeepLinking Hook
 * Handles incoming deep links for circle invites
 * Supports both immediate deep links and deferred deep links for new users
 */
import { useEffect, useCallback } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
    parseInviteLink,
    storePendingInvite,
    isInviteLink,
} from "~utils/deepLinking";
import { joinCircleViaInvite } from "~redux/actions/inviteActions";

/**
 * Custom hook to handle deep linking for circle invites
 */
const useDeepLinking = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { user } = useSelector((state) => state.auth);
    const isAuthenticated = !!user;

    /**
     * Handle invite link - join circle if authenticated, store if not
     */
    const handleInviteLink = useCallback(
        async (url) => {
            if (!url || !isInviteLink(url)) return;

            const inviteCode = parseInviteLink(url);
            if (!inviteCode) {
                Toast.show({
                    type: "error",
                    text1: "Invalid Invite Link",
                    text2: "The invite link is not valid",
                });
                return;
            }

            // If user is authenticated, join circle immediately
            if (isAuthenticated) {
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
                        text2: "You've been added to the circle",
                    });

                    // Navigate to circle screen
                    navigation.navigate("Circle");
                } catch (err) {
                    Toast.show({
                        type: "error",
                        text1: "Failed to Join",
                        text2: err || "Could not join the circle",
                    });
                }
            } else {
                // Store invite for after signup/login (deferred deep linking)
                await storePendingInvite(inviteCode);

                Toast.show({
                    type: "info",
                    text1: "Please Sign In",
                    text2: "Sign in to join this circle",
                });

                // Navigate to auth screens
                navigation.navigate("Auth");
            }
        },
        [dispatch, isAuthenticated, navigation],
    );

    /**
     * Listen for incoming deep links
     */
    useEffect(() => {
        // Handle initial URL (app opened via deep link)
        const handleInitialURL = async () => {
            try {
                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) {
                    handleInviteLink(initialUrl);
                }
            } catch (err) {
                console.error("Error handling initial URL:", err);
            }
        };

        handleInitialURL();

        // Listen for deep links while app is open
        const linkingListener = Linking.addEventListener("url", ({ url }) => {
            handleInviteLink(url);
        });

        return () => {
            linkingListener.remove();
        };
    }, [handleInviteLink]);

    return {
        handleInviteLink,
    };
};

export default useDeepLinking;
