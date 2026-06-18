/**
 * LocationPermissionGate
 * Checks location permission when user is logged in.
 * If permission is not granted, shows a custom modal prompting the user
 * to enable location for finding nearby stores.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { RFValue } from "react-native-responsive-fontsize";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";

import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";
import useLocation from "~hooks/useLocation";
import {
    setPermissionGranted,
    dismissLocationPrompt,
} from "~redux/reducers/locationReducer";
import { fetchCurrentLocation } from "~redux/actions/locationActions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LocationPermissionGate = ({ enabled = true }) => {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const { permissionGranted, promptDismissed, isLocationSet } = useSelector(
        (state) => state.location,
    );

    const {
        requestLocationPermission,
        loading: locationLoading,
    } = useLocation();

    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(false);

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    /**
     * Check permission status on mount
     * Show modal only if permission not granted and user hasn't dismissed
     */
    useEffect(() => {
        // Don't run until the notification permission flow has completed
        if (!enabled) return;
        if (permissionGranted || promptDismissed) return;

        const checkPermission = async () => {
            const { check, PERMISSIONS, RESULTS } = require("react-native-permissions");
            const permission = Platform.select({
                ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            });

            if (!permission) return;

            try {
                const status = await check(permission);
                if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
                    dispatch(setPermissionGranted(true));

                    // If permission is granted but no location stored, fetch it
                    if (!isLocationSet) {
                        fetchAndStoreLocation();
                    }
                } else {
                    // Permission not granted — show the modal
                    showModal();
                }
            } catch {
                // Permission check failed — silently skip
            }
        };

        // Small delay to let the app settle after login
        const timer = setTimeout(checkPermission, 1000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionGranted, promptDismissed, enabled]);


    /**
     * Animate modal in
     */
    const showModal = useCallback(() => {
        setVisible(true);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [scaleAnim, opacityAnim]);

    /**
     * Animate modal out
     */
    const hideModal = useCallback(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => setVisible(false));
    }, [scaleAnim, opacityAnim]);

    /**
     * Fetch location and store in Redux using the centralized thunk
     */
    const fetchAndStoreLocation = useCallback(async () => {
        dispatch(fetchCurrentLocation());
    }, [dispatch]);

    /**
     * Handle "Continue" press — triggers the system permission dialog.
     * Modal always closes after the flow completes (granted or denied).
     */
    const handleEnableLocation = useCallback(async () => {
        setChecking(true);

        const granted = await requestLocationPermission({ interactive: true, t });

        if (granted) {
            dispatch(setPermissionGranted(true));
            Toast.show({
                type: "success",
                text1: t("location_title"),
                text2: t("location_success"),
            });
            fetchAndStoreLocation();
        } else {
            // User was shown the system dialog (or Settings alert) and declined.
            // Record the decision so the modal does not reappear.
            dispatch(dismissLocationPrompt());
            Toast.show({
                type: "info",
                text1: t("location_denied_title"),
                text2: t("location_denied_desc"),
            });
        }

        hideModal();
        setChecking(false);
    }, [
        requestLocationPermission,
        dispatch,
        hideModal,
        fetchAndStoreLocation,
        t,
    ]);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent>
            <Animated.View
                style={[
                    styles.overlay,
                    { opacity: opacityAnim, backgroundColor: colors.modalOverlay },
                ]}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.modalBackground,
                            shadowColor: colors.shadowColor,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}>
                    {/* Location Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor: isDark
                                    ? "rgba(30, 157, 241, 0.15)"
                                    : "#EBF5FF",
                            },
                        ]}>
                        <Icon
                            name="location"
                            size={RFValue(36)}
                            color="#1E9DF1"
                        />
                    </View>

                    {/* Title */}
                    <Text
                        style={[styles.title, { color: colors.textPrimary }]}>
                        {t("location_title")}
                    </Text>

                    {/* Message */}
                    <Text
                        style={[styles.message, { color: colors.textSecondary }]}>
                        {t("location_subtitle")}
                    </Text>

                    {/* Features list */}
                    <View style={styles.featuresList}>
                        {[
                            "🛒  Find stores near you",
                            "🏷️  Compare prices in your area",
                            "📍  Get distance-based results",
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Text
                                    style={[
                                        styles.featureText,
                                        { color: colors.textSecondary },
                                    ]}>
                                    {feature}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Continue button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleEnableLocation}
                            disabled={checking || locationLoading}
                            style={[
                                styles.button,
                                styles.enableButton,
                                { backgroundColor: "#1E9DF1" },
                                (checking || locationLoading) && { opacity: 0.6 },
                            ]}>
                            <Icon
                                name="navigate"
                                size={RFValue(14)}
                                color="#FFFFFF"
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                                {checking ? t("location_detecting") : t("location_allow")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: SCREEN_WIDTH - 48,
        maxWidth: 380,
        borderRadius: 24,
        padding: RFValue(24),
        alignItems: "center",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    iconContainer: {
        width: RFValue(72),
        height: RFValue(72),
        borderRadius: RFValue(36),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: RFValue(16),
    },
    title: {
        fontSize: RFValue(18),
        fontWeight: "700",
        textAlign: "center",
        marginBottom: RFValue(8),
    },
    message: {
        fontSize: RFValue(12),
        textAlign: "center",
        lineHeight: RFValue(18),
        marginBottom: RFValue(16),
    },
    featuresList: {
        alignSelf: "stretch",
        marginBottom: RFValue(20),
        gap: RFValue(8),
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: RFValue(8),
        paddingLeft: RFValue(8),
    },
    featureText: {
        fontSize: RFValue(12),
        flex: 1,
    },
    buttonContainer: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: RFValue(12),
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    enableButton: {},
    buttonText: {
        fontSize: RFValue(13),
        fontWeight: "600",
    },
});

export default LocationPermissionGate;
