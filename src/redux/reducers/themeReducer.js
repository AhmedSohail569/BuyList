/**
 * Theme Redux Slice
 * Manages theme preference (light/dark/system) with persistence
 */
import { createSlice } from "@reduxjs/toolkit";
import { Appearance } from "react-native";

// Theme types
export const ThemeMode = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
};

// Get system theme preference
const getSystemTheme = () => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === "dark" ? ThemeMode.DARK : ThemeMode.LIGHT;
};

const initialState = {
    // Theme preference: 'light', 'dark', or 'system'
    mode: ThemeMode.LIGHT,
    // Actual resolved theme (always 'light' or 'dark')
    resolvedTheme: ThemeMode.LIGHT,
    // Quick access flag
    isDark: false,
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        // Set theme mode (light, dark, or system)
        setThemeMode(state, action) {
            const mode = action.payload;
            state.mode = mode;

            // Resolve the actual theme
            if (mode === ThemeMode.SYSTEM) {
                const systemTheme = getSystemTheme();
                state.resolvedTheme = systemTheme;
                state.isDark = systemTheme === ThemeMode.DARK;
            } else {
                state.resolvedTheme = mode;
                state.isDark = mode === ThemeMode.DARK;
            }
        },

        // Toggle between light and dark (ignores system)
        toggleTheme(state) {
            const newMode =
                state.resolvedTheme === ThemeMode.LIGHT
                    ? ThemeMode.DARK
                    : ThemeMode.LIGHT;
            state.mode = newMode;
            state.resolvedTheme = newMode;
            state.isDark = newMode === ThemeMode.DARK;
        },

        // Update resolved theme when system theme changes (only if mode is 'system')
        updateSystemTheme(state) {
            if (state.mode === ThemeMode.SYSTEM) {
                const systemTheme = getSystemTheme();
                state.resolvedTheme = systemTheme;
                state.isDark = systemTheme === ThemeMode.DARK;
            }
        },

        // Initialize theme on app start (handles rehydration)
        initializeTheme(state) {
            // If mode is system, resolve based on current system preference
            if (state.mode === ThemeMode.SYSTEM) {
                const systemTheme = getSystemTheme();
                state.resolvedTheme = systemTheme;
                state.isDark = systemTheme === ThemeMode.DARK;
            } else {
                state.resolvedTheme = state.mode;
                state.isDark = state.mode === ThemeMode.DARK;
            }
        },
    },
});

export const { setThemeMode, toggleTheme, updateSystemTheme, initializeTheme } =
    themeSlice.actions;

export default themeSlice.reducer;
