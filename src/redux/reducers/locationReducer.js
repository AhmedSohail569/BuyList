/**
 * Location Reducer
 * Persists user location data for use across the app
 * (search APIs, distance calculations, etc.)
 */
import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./authReducer";

const initialState = {
    latitude: null,
    longitude: null,
    city: "",
    area: "",
    isLocationSet: false,
    // Track whether permission was granted (avoids re-prompting)
    permissionGranted: false,
    // Track if user explicitly dismissed the prompt (don't re-show until next session)
    promptDismissed: false,
};

const locationSlice = createSlice({
    name: "location",
    initialState,
    reducers: {
        /**
         * Store detected or manually entered location
         */
        setLocation(state, action) {
            const { latitude, longitude, city, area } = action.payload;
            state.latitude = latitude ?? state.latitude;
            state.longitude = longitude ?? state.longitude;
            state.city = city ?? state.city;
            state.area = area ?? state.area;
            state.isLocationSet = true;
        },

        /**
         * Update only city and area (manual override)
         */
        updateCityArea(state, action) {
            const { city, area } = action.payload;
            if (city !== undefined) state.city = city;
            if (area !== undefined) state.area = area;
        },

        /**
         * Mark location permission as granted
         */
        setPermissionGranted(state, action) {
            state.permissionGranted = action.payload;
        },

        /**
         * Mark prompt as dismissed for this session
         */
        dismissLocationPrompt(state) {
            state.promptDismissed = true;
        },

        /**
         * Reset prompt dismissed flag (e.g., on app restart)
         */
        resetLocationPrompt(state) {
            state.promptDismissed = false;
        },

        /**
         * Clear all location data (e.g., on logout)
         */
        clearLocation() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        // Clear location state on logout
        builder.addCase(logout, () => {
            return initialState;
        });
    },
});

export const {
    setLocation,
    updateCityArea,
    setPermissionGranted,
    dismissLocationPrompt,
    resetLocationPrompt,
    clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
