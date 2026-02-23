/**
 * useLocation Hook
 * Handles location permissions, geolocation, and reverse geocoding
 */
import { useState, useCallback, useRef } from "react";
import { Platform, Alert, Linking } from "react-native";
import Geolocation from "react-native-geolocation-service";
import {
    check,
    request,
    PERMISSIONS,
    RESULTS,
    openSettings,
} from "react-native-permissions";
import {
    reverseGeocode,
    getCityFromComponents,
    getAreaFromComponents,
} from "~utils/geocoding";

const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 10000,
};

/** Platform-appropriate location permission */
const getLocationPermission = () =>
    Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });

/** Prompt user to open settings when permission is permanently blocked */
const showSettingsAlert = () => {
    Alert.alert(
        "Location Access Required",
        "Location permission is needed to find nearby stores and deals. Please enable it in your device settings.",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Open Settings",
                onPress: () => openSettings().catch(() => Linking.openSettings()),
            },
        ],
    );
};

const useLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState(null);
    const [locationData, setLocationData] = useState(null);
    const isFetchingRef = useRef(false);

    /** Check / request location permission */
    const requestLocationPermission = useCallback(async () => {
        const permission = getLocationPermission();
        if (!permission) return false;

        try {
            const status = await check(permission);

            switch (status) {
                case RESULTS.GRANTED:
                case RESULTS.LIMITED:
                    return true;

                case RESULTS.DENIED: {
                    const result = await request(permission);
                    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
                }

                case RESULTS.BLOCKED:
                    showSettingsAlert();
                    return false;

                case RESULTS.UNAVAILABLE:
                    setError("Location services are not available on this device");
                    return false;

                default:
                    return false;
            }
        } catch {
            setError("Failed to check location permission");
            return false;
        }
    }, []);

    /** Get current device position */
    const getCurrentPosition = useCallback(() => {
        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                },
                (err) => {
                    const messages = {
                        1: "Location permission was denied",
                        2: "Unable to determine your location. Please try again.",
                        3: "Location request timed out. Please try again.",
                    };
                    setError(messages[err.code] || "Failed to get your location");
                    resolve(null);
                },
                GEOLOCATION_OPTIONS,
            );
        });
    }, []);

    /** Full location flow: permission → geolocation → reverse geocoding */
    const detectLocation = useCallback(async () => {
        if (isFetchingRef.current) return null;
        isFetchingRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) return null;

            const position = await getCurrentPosition();
            if (!position) return null;

            setCoordinates(position);

            // Attempt reverse geocoding — fallback to coords-only if it fails
            let city = "";
            let area = "";

            try {
                const geoResult = await reverseGeocode(position.latitude, position.longitude);
                city = getCityFromComponents(geoResult.address_components);
                area = getAreaFromComponents(geoResult.address_components);
            } catch {
                // Geocoding failed — coordinates still usable
            }

            const result = { ...position, city, area };
            setLocationData(result);
            return result;
        } catch {
            setError("Something went wrong while detecting your location");
            return null;
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [requestLocationPermission, getCurrentPosition]);

    const clearError = useCallback(() => setError(null), []);

    return {
        detectLocation,
        loading,
        error,
        coordinates,
        locationData,
        clearError,
        requestLocationPermission,
    };
};

export default useLocation;
