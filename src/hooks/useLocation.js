/**
 * useLocation Hook
 * Handles location permissions, geolocation, and reverse geocoding
 * Uses Google Geocoding API for reliable address resolution
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

// Geolocation config
const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 10000,
};

/**
 * Get the appropriate location permission based on platform
 */
const getLocationPermission = () => {
    return Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
};

/**
 * Show settings alert when permission is permanently denied
 */
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

/**
 * Custom hook for location detection with permissions handling
 */
const useLocation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState(null); // { latitude, longitude }
    const [locationData, setLocationData] = useState(null); // { city, area, latitude, longitude }
    const isFetchingRef = useRef(false);

    /**
     * Check and request location permission
     * @returns {Promise<boolean>} Whether permission was granted
     */
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
                    const requestResult = await request(permission);
                    return (
                        requestResult === RESULTS.GRANTED ||
                        requestResult === RESULTS.LIMITED
                    );
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
        } catch (err) {
            console.error("Location permission error:", err);
            setError("Failed to check location permission");
            return false;
        }
    }, []);

    /**
     * Get current position using Geolocation
     * @returns {Promise<{latitude: number, longitude: number}|null>}
     */
    const getCurrentPosition = useCallback(() => {
        return new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                },
                (err) => {
                    console.error("Geolocation error:", err);

                    // Provide user-friendly error messages
                    switch (err.code) {
                        case 1: // PERMISSION_DENIED
                            setError("Location permission was denied");
                            break;
                        case 2: // POSITION_UNAVAILABLE
                            setError("Unable to determine your location. Please try again.");
                            break;
                        case 3: // TIMEOUT
                            setError("Location request timed out. Please try again.");
                            break;
                        default:
                            setError("Failed to get your location");
                    }

                    resolve(null);
                },
                GEOLOCATION_OPTIONS,
            );
        });
    }, []);

    /**
     * Full location flow: permission → geolocation → reverse geocoding
     * @returns {Promise<{latitude, longitude, city, area}|null>}
     */
    const detectLocation = useCallback(async () => {
        // Prevent duplicate calls
        if (isFetchingRef.current) return null;
        isFetchingRef.current = true;

        setLoading(true);
        setError(null);

        try {
            // Step 1: Request permission
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) {
                setLoading(false);
                isFetchingRef.current = false;
                return null;
            }

            // Step 2: Get current position
            const position = await getCurrentPosition();
            if (!position) {
                setLoading(false);
                isFetchingRef.current = false;
                return null;
            }

            setCoordinates(position);

            // Step 3: Reverse geocode using Google API
            try {
                const geoResult = await reverseGeocode(
                    position.latitude,
                    position.longitude,
                );

                const city = getCityFromComponents(geoResult.address_components);
                const area = getAreaFromComponents(geoResult.address_components);

                const result = {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    city,
                    area,
                };

                setLocationData(result);
                setLoading(false);
                isFetchingRef.current = false;
                return result;
            } catch (geoErr) {
                // If geocoding fails, still return coordinates without city/area
                console.error("Reverse geocoding error:", geoErr);
                
                const result = {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    city: "",
                    area: "",
                };

                setLocationData(result);
                setLoading(false);
                isFetchingRef.current = false;
                return result;
            }
        } catch (err) {
            console.error("Location detection error:", err);
            setError("Something went wrong while detecting your location");
            setLoading(false);
            isFetchingRef.current = false;
            return null;
        }
    }, [requestLocationPermission, getCurrentPosition]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

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
