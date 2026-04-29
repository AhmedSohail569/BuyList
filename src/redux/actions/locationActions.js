/**
 * Location Actions
 * Centralized thunks for location detection and state management
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Platform } from "react-native";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { fetchLocationData } from "~utils/location";
import { setLocation, setPermissionGranted } from "../reducers/locationReducer";

/**
 * Detect current position and store in Redux.
 * Handles permission checking silently (non-interactive).
 */
export const fetchCurrentLocation = createAsyncThunk(
    "location/fetchCurrentLocation",
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // 1. Check permission status silently
            const permission = Platform.select({
                ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            });

            if (!permission) return rejectWithValue("Location not supported on this platform");

            const status = await check(permission);

            // 2. Only proceed if permission is already granted
            if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
                dispatch(setPermissionGranted(true));

                // 3. Fetch fresh coordinates + geocoding
                const data = await fetchLocationData();
                if (data) {
                    dispatch(setLocation(data));
                    return data;
                }
                return rejectWithValue("Failed to acquire location coordinates");
            } else {
                dispatch(setPermissionGranted(false));
                return rejectWithValue("Location permission not granted");
            }
        } catch (error) {
            return rejectWithValue(error.message || "An error occurred while fetching location");
        }
    },
);
