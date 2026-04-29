/**
 * Location Utilities
 * Pure JS functions for geolocation and reverse geocoding
 * (used by locationActions thunks and components)
 */
import Geolocation from "react-native-geolocation-service";
import { reverseGeocode, getCityFromComponents, getAreaFromComponents } from "./geocoding";
import { checkConnectivity } from "./network";

const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 10000,
};

/**
 * Get current device position as a Promise
 */
export const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ latitude, longitude });
            },
            (err) => {
                reject(err);
            },
            GEOLOCATION_OPTIONS,
        );
    });
};

/**
 * Full location detection flow:
 * 1. Connectivity check
 * 2. Geolocation (lat/lng)
 * 3. Reverse geocoding (city/area) - optional
 */
export const fetchLocationData = async () => {
    const isConnected = await checkConnectivity();
    if (!isConnected) return null;

    try {
        const position = await getCurrentPosition();
        if (!position) return null;

        let city = "";
        let area = "";

        try {
            // Reverse geocode fallback
            const geoResult = await reverseGeocode(position.latitude, position.longitude);
            city = getCityFromComponents(geoResult.address_components);
            area = getAreaFromComponents(geoResult.address_components);
        } catch (err) {
            // Ignore reverse geocoding errors — coordinates are still primary
        }

        return {
            latitude: position.latitude,
            longitude: position.longitude,
            city,
            area,
        };
    } catch (err) {
        console.error("[LocationUtil] Detection failed:", err);
        return null;
    }
};
