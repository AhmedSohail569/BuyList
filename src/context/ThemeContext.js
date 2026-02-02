/**
 * Theme Context and Provider
 * Provides theme colors and dark mode state to the entire app
 */
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { StatusBar, useColorScheme } from "react-native";
import { lightColors, darkColors } from "~theme/colors";
import {
    setThemeMode,
    toggleTheme,
    updateSystemTheme,
    initializeTheme,
    ThemeMode,
} from "~redux/reducers/themeReducer";

// Create the context
const ThemeContext = createContext(null);

/**
 * ThemeProvider Component
 * Wraps the app and provides theme context to all children
 */
export const ThemeProvider = ({ children }) => {
    const dispatch = useDispatch();
    const systemColorScheme = useColorScheme();

    // Get theme state from Redux
    const { mode, resolvedTheme, isDark } = useSelector(state => state.theme);

    // Get the appropriate color palette
    const colors = useMemo(
        () => (isDark ? darkColors : lightColors),
        [isDark],
    );

    // Initialize theme on mount
    useEffect(() => {
        dispatch(initializeTheme());
    }, [dispatch]);

    // Listen to system theme changes when mode is 'system'
    useEffect(() => {
        if (mode === ThemeMode.SYSTEM) {
            dispatch(updateSystemTheme());
        }
    }, [systemColorScheme, mode, dispatch]);

    // Update status bar based on theme
    useEffect(() => {
        StatusBar.setBarStyle(isDark ? "light-content" : "dark-content", true);
    }, [isDark]);

    // Theme change handler
    const changeTheme = useCallback(
        newMode => {
            dispatch(setThemeMode(newMode));
        },
        [dispatch],
    );

    // Toggle theme handler
    const toggle = useCallback(() => {
        dispatch(toggleTheme());
    }, [dispatch]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({
            colors,
            isDark,
            mode,
            resolvedTheme,
            setTheme: changeTheme,
            toggleTheme: toggle,
            ThemeMode,
        }),
        [colors, isDark, mode, resolvedTheme, changeTheme, toggle],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

/**
 * useTheme Hook
 * Custom hook to access theme context anywhere in the app
 * @returns {Object} Theme context with colors, isDark, and theme controls
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};

/**
 * withTheme HOC
 * Higher-order component to inject theme props into class components
 */
export const withTheme = Component => {
    const ThemedComponent = props => {
        const theme = useTheme();
        return <Component {...props} theme={theme} />;
    };

    ThemedComponent.displayName = `withTheme(${Component.displayName || Component.name || "Component"})`;
    return ThemedComponent;
};

export default ThemeContext;
