/**
 * ChangeHomeLocation Screen
 * Allows users to search, detect, and confirm their circle's home location.
 * Uses react-native-maps for interactive map and Google Geocoding API.
 * Saves the zone via PUT /auth/update-zone.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    Dimensions,
    FlatList,
    Platform,
    TextInput as RNTextInput,
    Animated,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";
import FeatherIcon from "react-native-vector-icons/Feather";

import { Text } from "~components/Common";
import Header from "~components/Header";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";
import useLocation from "~hooks/useLocation";
import { updateZone } from "~redux/actions/authActions";
import { setLocation } from "~redux/reducers/locationReducer";
import {
    geocodeAddress,
    forwardGeocode,
    reverseGeocode,
    formatAddress,
    getCityFromComponents,
    getAreaFromComponents,
} from "~utils/geocoding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DEFAULT_DELTA = 0.006;

// ============================================
// COMPONENT
// ============================================
const ChangeHomeLocationScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    const { detectLocation, loading: detectingLocation } = useLocation();
    const { user } = useSelector((state) => state.auth);
    const { ownedCircles } = useSelector((state) => state.circles);

    // Get the saved home address (zone) from ownedCircles or user
    const savedHomeAddress = ownedCircles?.owner?.zone || user?.zone || "";

    const [selectedAddress, setSelectedAddress] = useState(savedHomeAddress);
    // null until the owner's zone is geocoded — no hardcoded fallback
    const [selectedCoords, setSelectedCoords] = useState(null);

    // Track whether location permission is granted (to safely enable showsUserLocation)
    const [hasLocationPermission, setHasLocationPermission] = useState(false);

    // true while we are geocoding the saved zone address
    const [geocoding, setGeocoding] = useState(!!savedHomeAddress);
    // Guard so the geocode only runs once — prevents re-triggering if the selector
    // value changes due to re-renders after the first successful geocode.
    const geocodedRef = useRef(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reverseLoading, setReverseLoading] = useState(false);

    const debounceRef = useRef(null);
    const reverseDebounceRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const markerScale = useRef(new Animated.Value(1)).current;

    // Guard mapPadding until the native GoogleMap instance is ready.
    // Without this, Android crashes: "setPadding on a null object reference".
    const [isMapReady, setIsMapReady] = useState(false);

    // Measured height of the bottom sheet (via onLayout).
    // Drives two things in sync:
    //   1. mapPadding.bottom  — shifts the map's logical centre above the sheet
    //   2. centerMarkerContainer.bottom — keeps the pin at the same visual centre
    const [bottomSheetHeight, setBottomSheetHeight] = useState(0);

    // iOS keyboard animation: slide the absolute sheet up by exactly keyboard height.
    // Android: windowSoftInputMode="adjustResize" pins the sheet natively — no JS.
    const sheetBottom = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (Platform.OS !== "ios") return;
        const onShow = Keyboard.addListener("keyboardWillShow", (e) => {
            Animated.timing(sheetBottom, {
                toValue: e.endCoordinates.height,
                duration: e.duration ?? 250,
                useNativeDriver: false,
            }).start();
        });
        const onHide = Keyboard.addListener("keyboardWillHide", (e) => {
            Animated.timing(sheetBottom, {
                toValue: 0,
                duration: e.duration ?? 200,
                useNativeDriver: false,
            }).start();
        });
        return () => { onShow.remove(); onHide.remove(); };
    }, [sheetBottom]);

    // ============================================
    // Load saved home address — runs whenever savedHomeAddress first becomes available.
    // The geocodedRef guard ensures we only geocode once even if the selector value
    // changes due to re-renders after the first successful load.
    // ============================================
    useEffect(() => {
        if (!savedHomeAddress || geocodedRef.current) {
            setGeocoding(false);
            return;
        }

        geocodedRef.current = true;
        setGeocoding(true);

        const loadHomeLocation = async () => {
            try {
                // Use the Geocoding API directly — it natively resolves Plus Codes
                // (e.g. "F798+RM8, Johar Town, Lahore") unlike Places Autocomplete.
                let result = await geocodeAddress(savedHomeAddress);

                // Fallback: strip a leading Plus Code and retry with the plain address
                if (!result) {
                    const stripped = savedHomeAddress.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,8},?\s*/i, "").trim();
                    if (stripped && stripped !== savedHomeAddress) {
                        result = await geocodeAddress(stripped);
                    }
                }

                if (result) {
                    const coords = { latitude: result.lat, longitude: result.lon };
                    setSelectedCoords(coords);
                    setTimeout(() => animateToCoords(coords.latitude, coords.longitude), 300);
                }
            } catch {
                // geocoding failed — coords stay null, user can search/detect manually
            } finally {
                setGeocoding(false);
            }
        };

        loadHomeLocation();
    }, [savedHomeAddress, animateToCoords, setGeocoding]);

    // ============================================
    // Debounced forward geocode on query change
    // ============================================
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            const results = await forwardGeocode(searchQuery);
            setSearchResults(results);
            setShowResults(results.length > 0);
            setSearching(false);
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    // ============================================
    // Animate map to coordinates
    // ============================================
    const animateToCoords = useCallback((lat, lng) => {
        try {
            mapRef.current?.animateToRegion(
                {
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: DEFAULT_DELTA,
                    longitudeDelta: DEFAULT_DELTA,
                },
                600,
            );
        } catch {
            // Map might not be ready yet, silently ignore
        }
    }, []);

    // ============================================
    // Handle map region change (drag / zoom)
    // ============================================
    const handleRegionChange = useCallback(() => {
        setIsDragging(true);
        // Scale down marker slightly during drag
        Animated.spring(markerScale, {
            toValue: 0.85,
            friction: 5,
            useNativeDriver: true,
        }).start();

        // Clear any pending reverse geocode
        if (reverseDebounceRef.current) {
            clearTimeout(reverseDebounceRef.current);
            reverseDebounceRef.current = null;
        }
    }, [markerScale]);

    // ============================================
    // Handle map region change complete (user stopped dragging)
    // ============================================
    const handleRegionChangeComplete = useCallback(
        (region) => {
            setIsDragging(false);
            // Bounce marker back
            Animated.spring(markerScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }).start();

            const { latitude, longitude } = region;
            setSelectedCoords({ latitude, longitude });
            setShowResults(false);

            // Debounced reverse geocode
            if (reverseDebounceRef.current) {
                clearTimeout(reverseDebounceRef.current);
            }

            setReverseLoading(true);
            reverseDebounceRef.current = setTimeout(async () => {
                try {
                    const geoResult = await reverseGeocode(latitude, longitude);
                    if (geoResult && geoResult.display_name) {
                        const address = formatAddress(geoResult);
                        setSelectedAddress(address);
                        setSearchQuery("");
                    } else {
                        setSelectedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                        setSearchQuery("");
                    }
                } catch {
                    setSelectedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    setSearchQuery("");
                } finally {
                    setReverseLoading(false);
                }
            }, 400);
        },
        [markerScale],
    );

    // ============================================
    // Handle selecting a search result
    // ============================================
    const handleSelectResult = useCallback(
        (result) => {
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            const address = formatAddress(result);

            setSelectedCoords({ latitude: lat, longitude: lng });
            setSelectedAddress(address);
            setSearchQuery(address);
            setShowResults(false);
            Keyboard.dismiss();

            // Animate map to the selected location
            animateToCoords(lat, lng);
        },
        [animateToCoords],
    );

    // ============================================
    // Handle detect current location via GPS
    // ============================================
    const handleDetectLocation = useCallback(async () => {
        Keyboard.dismiss();
        setShowResults(false);

        try {
            const result = await detectLocation();
            if (result) {
                const { latitude, longitude } = result;
                setSelectedCoords({ latitude, longitude });
                setHasLocationPermission(true);

                // Animate map
                animateToCoords(latitude, longitude);

                // Reverse geocode
                setReverseLoading(true);
                try {
                    const geoResult = await reverseGeocode(latitude, longitude);
                    const address = formatAddress(geoResult);
                    setSelectedAddress(address);
                    setSearchQuery(address);

                    // Extract city and area using shared utility functions
                    const city = getCityFromComponents(geoResult.address_components);
                    const area = getAreaFromComponents(geoResult.address_components);

                    // Update Redux
                    dispatch(
                        setLocation({
                            latitude,
                            longitude,
                            city,
                            area,
                        }),
                    );

                    Toast.show({
                        type: "success",
                        text1: "Location Detected",
                        text2: address || "Location coordinates saved",
                    });
                } catch {
                    // Still save coordinates even if geocoding fails
                    setSelectedAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    setSearchQuery("");

                    dispatch(
                        setLocation({
                            latitude,
                            longitude,
                            city: "",
                            area: "",
                        }),
                    );

                    Toast.show({
                        type: "info",
                        text1: "Location Detected",
                        text2: "Using coordinates (address lookup failed)",
                    });
                } finally {
                    setReverseLoading(false);
                }
            }
        } catch {
            Toast.show({
                type: "error",
                text1: "Location Error",
                text2: "Failed to detect location. Please try again.",
            });
        }
    }, [detectLocation, dispatch, animateToCoords]);

    // ============================================
    // Handle save location
    // ============================================
    const handleSave = useCallback(async () => {
        if (!selectedAddress.trim()) {
            Toast.show({
                type: "error",
                text1: "Location Required",
                text2: "Please search or detect a location first.",
            });
            return;
        }

        setSaving(true);
        try {
            await dispatch(updateZone({ zone: selectedAddress.trim() })).unwrap();

            dispatch(
                setLocation({
                    latitude: selectedCoords.latitude,
                    longitude: selectedCoords.longitude,
                }),
            );

            Toast.show({
                type: "success",
                text1: "Location Updated",
                text2: "Your home location has been saved.",
            });
            navigation.goBack();
        } catch (err) {
            Toast.show({
                type: "error",
                text1: "Update Failed",
                text2: typeof err === "string" ? err : "Failed to update location.",
            });
        } finally {
            setSaving(false);
        }
    }, [selectedAddress, selectedCoords, dispatch, navigation]);

    // ============================================
    // Render search result item
    // ============================================
    const renderSearchItem = useCallback(
        ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.resultItem, { borderBottomColor: colors.divider }]}
                onPress={() => handleSelectResult(item)}>
                <Icon
                    name="location-outline"
                    size={RFValue(16)}
                    color={colors.textSecondary}
                    style={styles.resultIcon}
                />
                <View style={styles.resultTextContainer}>
                    <Text
                        style={[styles.resultTitle, { color: colors.textPrimary }]}
                        numberOfLines={1}>
                        {item.display_name?.split(",")[0]}
                    </Text>
                    <Text
                        style={[styles.resultSubtitle, { color: colors.textSecondary }]}
                        numberOfLines={1}>
                        {item.display_name}
                    </Text>
                </View>
            </TouchableOpacity>
        ),
        [colors, handleSelectResult],
    );

    // ============================================
    // RENDER
    // ============================================
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header
                variant="screen"
                title="Change Home Location"
                onBack={() => navigation.goBack()}
            />

            {/* ======================== MAP ======================== */}
            <View style={styles.mapWrapper}>
                {geocoding ? (
                    /* Geocoding the owner's zone — show spinner until coords are ready */
                    <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary, paddingBottom: bottomSheetHeight }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
                            Loading home location…
                        </Text>
                    </View>
                ) : selectedCoords ? (
                    /* Coords available — render interactive map */
                    <>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                            initialRegion={{
                                latitude: selectedCoords.latitude,
                                longitude: selectedCoords.longitude,
                                latitudeDelta: DEFAULT_DELTA,
                                longitudeDelta: DEFAULT_DELTA,
                            }}
                            onPress={() => Keyboard.dismiss()}
                            onRegionChange={handleRegionChange}
                            onRegionChangeComplete={handleRegionChangeComplete}
                            showsUserLocation={hasLocationPermission}
                            showsMyLocationButton={false}
                            showsCompass={false}
                            mapType="standard"
                            userInterfaceStyle={isDark ? "dark" : "light"}
                            onMapReady={() => setIsMapReady(true)}
                            mapPadding={isMapReady ? { top: 0, left: 0, right: 0, bottom: bottomSheetHeight } : undefined}
                        />

                        {/* Center-pinned marker */}
                        <View
                            style={[styles.centerMarkerContainer, { bottom: bottomSheetHeight }]}
                            pointerEvents="none">
                            {(selectedAddress || reverseLoading) && (
                                <View
                                    style={[
                                        styles.addressBubble,
                                        {
                                            backgroundColor: isDark ? colors.card : "#FFFFFF",
                                            shadowColor: colors.shadowColor,
                                        },
                                    ]}>
                                    {reverseLoading ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text
                                            style={[styles.addressBubbleText, { color: colors.textPrimary }]}
                                            numberOfLines={1}>
                                            {selectedAddress}
                                        </Text>
                                    )}
                                </View>
                            )}
                            <View style={styles.addressMarkerSpacer} />
                            <Animated.View style={{ transform: [{ scale: markerScale }] }}>
                                <View style={styles.customMarker}>
                                    <View style={[styles.markerCircle, isDragging && styles.markerCircleDragging]}>
                                        <Icon name="navigate" size={RFValue(16)} color="#FFFFFF" />
                                    </View>
                                    <View style={[styles.markerTail, isDragging && styles.markerTailDragging]} />
                                </View>
                            </Animated.View>
                            <View style={[styles.markerShadowDot, isDragging && styles.markerShadowDotDragging]} />
                        </View>
                    </>
                ) : (
                    /* No zone set yet — prompt user to search or detect */
                    <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary, paddingBottom: bottomSheetHeight }]}>
                        <Icon name="location-outline" size={RFValue(36)} color={colors.textMuted} />
                        <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
                            Search for an address or detect your location below
                        </Text>
                    </View>
                )}

                {/* Detect Location FAB — always visible so user can pick a location */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.detectFab,
                        {
                            backgroundColor: isDark ? colors.card : "#FFFFFF",
                            shadowColor: colors.shadowColor,
                        },
                    ]}
                    onPress={handleDetectLocation}
                    disabled={detectingLocation || geocoding}>
                    {detectingLocation ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Icon name="locate" size={RFValue(20)} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

            {/* ======================== BOTTOM SHEET ======================== */}
            {/* Absolute-positioned sheet: stays visible regardless of keyboard.
                iOS: Animated.timing slides it above the keyboard.
                Android: adjustResize pins it natively. */}
            <Animated.View
                onLayout={(e) => setBottomSheetHeight(e.nativeEvent.layout.height)}
                style={[
                    styles.bottomSheet,
                    {
                        backgroundColor: isDark ? colors.card : "#FFFFFF",
                        paddingBottom: Math.max(insets.bottom, RFValue(16)),
                        shadowColor: colors.shadowColor,
                        bottom: sheetBottom,
                    },
                ]}>
                {/* Title Row */}
                <View style={styles.sheetHeader}>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                        Confirm Home Location
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Icon
                            name="close"
                            size={RFValue(20)}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View
                    style={[
                        styles.searchRow,
                        {
                            backgroundColor: isDark
                                ? colors.backgroundSecondary
                                : "#F5F7FA",
                            borderColor: showResults
                                ? colors.primary
                                : isDark
                                    ? colors.border
                                    : "#E8ECF0",
                        },
                    ]}>
                    <FeatherIcon
                        name="search"
                        size={RFValue(14)}
                        color={colors.textMuted}
                        style={styles.searchIcon}
                    />
                    <RNTextInput
                        value={searchQuery || selectedAddress}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (!text.trim()) {
                                setShowResults(false);
                                setSearchResults([]);
                            }
                        }}
                        placeholder="Search for an address..."
                        placeholderTextColor={colors.textMuted}
                        style={[styles.textInput, { color: colors.textPrimary }]}
                        returnKeyType="search"
                        autoCorrect={false}
                        onFocus={() => {
                            // Clear the displayed address so user can type fresh
                            if (!searchQuery && selectedAddress) {
                                setSearchQuery("");
                            }
                            if (searchResults.length > 0) setShowResults(true);
                        }}
                    />
                    {searching && (
                        <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={styles.searchSpinner}
                        />
                    )}
                    {!searching && (searchQuery.length > 0 || selectedAddress.length > 0) && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                setSearchQuery("");
                                setSelectedAddress("");
                                setSearchResults([]);
                                setShowResults(false);
                            }}>
                            <Icon
                                name="close-circle"
                                size={RFValue(16)}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                    <View
                        style={[
                            styles.resultsDropdown,
                            {
                                backgroundColor: isDark ? colors.card : "#FFFFFF",
                                borderColor: isDark ? colors.border : "#E8ECF0",
                                shadowColor: colors.shadowColor,
                            },
                        ]}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.place_id?.toString()}
                            renderItem={renderSearchItem}
                            keyboardShouldPersistTaps="handled"
                            style={styles.resultsList}
                        />
                    </View>
                )}

                {/* Info Message */}
                <View style={styles.infoRow}>
                    <Icon
                        name="navigate-circle-outline"
                        size={RFValue(16)}
                        color={colors.primary}
                        style={styles.infoIcon}
                    />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        This location will be used to find nearby store availability and
                        deals for your circle.
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.saveButton,
                        {
                            backgroundColor: colors.primary,
                            opacity: saving || !selectedAddress.trim() ? 0.6 : 1,
                        },
                    ]}
                    onPress={handleSave}
                    disabled={saving || !selectedAddress.trim()}>
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Location</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Map
    mapWrapper: {
        flex: 1,
        position: "relative",
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },

    // Center-pinned marker overlay
    centerMarkerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 3,
    },

    // Custom marker
    customMarker: {
        alignItems: "center",
    },
    markerCircle: {
        width: RFValue(38),
        height: RFValue(38),
        borderRadius: RFValue(19),
        backgroundColor: "#1A1A2E",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    markerCircleDragging: {
        backgroundColor: "#2C2C54",
        shadowOpacity: 0.4,
    },
    markerTail: {
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 10,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#1A1A2E",
        marginTop: -1,
    },
    markerTailDragging: {
        borderTopColor: "#2C2C54",
    },
    markerShadowDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(0,0,0,0.25)",
        marginTop: 2,
    },
    markerShadowDotDragging: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "rgba(0,0,0,0.15)",
    },

    // Address bubble (above marker)
    addressBubble: {
        paddingHorizontal: RFValue(14),
        paddingVertical: RFValue(6),
        borderRadius: RFValue(10),
        maxWidth: SCREEN_WIDTH * 0.7,
        minHeight: RFValue(28),
        justifyContent: "center",
        alignItems: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    addressBubbleText: {
        fontSize: RFValue(10),
        fontFamily: FontFamily.medium,
        textAlign: "center",
    },
    addressMarkerSpacer: {
        height: RFValue(8),
    },

    // Detect Location FAB
    detectFab: {
        position: "absolute",
        bottom: RFValue(40),
        right: RFValue(16),
        width: RFValue(44),
        height: RFValue(44),
        borderRadius: RFValue(22),
        justifyContent: "center",
        alignItems: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        zIndex: 10,
    },

    // Bottom sheet — absolute, pinned to bottom, animated above keyboard on iOS
    bottomSheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: RFValue(24),
        borderTopRightRadius: RFValue(24),
        paddingTop: RFValue(20),
        paddingHorizontal: RFValue(20),
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 16,
        zIndex: 20,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: RFValue(16),
    },
    sheetTitle: {
        fontSize: RFValue(16),
        fontFamily: FontFamily.bold,
    },

    // Search input
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: RFValue(12),
        borderWidth: 1,
        paddingHorizontal: RFValue(12),
        height: RFValue(44),
        marginBottom: RFValue(4),
    },
    searchIcon: {
        marginRight: RFValue(8),
    },
    textInput: {
        flex: 1,
        fontSize: RFValue(12),
        fontFamily: FontFamily.regular,
        paddingVertical: 0,
        height: "100%",
    },
    searchSpinner: {
        marginLeft: RFValue(8),
    },

    // Search results dropdown
    resultsDropdown: {
        borderRadius: RFValue(12),
        borderWidth: 1,
        maxHeight: RFValue(180),
        marginBottom: RFValue(4),
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
        overflow: "hidden",
    },
    resultsList: {
        maxHeight: RFValue(180),
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: RFValue(10),
        paddingHorizontal: RFValue(12),
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    resultIcon: {
        marginRight: RFValue(10),
    },
    resultTextContainer: {
        flex: 1,
    },
    resultTitle: {
        fontSize: RFValue(11),
        fontFamily: FontFamily.medium,
        marginBottom: 1,
    },
    resultSubtitle: {
        fontSize: RFValue(9),
        fontFamily: FontFamily.regular,
    },

    // Info row
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: RFValue(12),
        marginBottom: RFValue(16),
        paddingHorizontal: RFValue(2),
    },
    infoIcon: {
        marginRight: RFValue(8),
        marginTop: RFValue(1),
    },
    infoText: {
        flex: 1,
        fontSize: RFValue(10),
        fontFamily: FontFamily.regular,
        lineHeight: RFValue(16),
    },

    // Save button
    saveButton: {
        height: RFValue(48),
        borderRadius: RFValue(14),
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: RFValue(14),
        fontFamily: FontFamily.bold,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: RFValue(12),
        paddingHorizontal: RFValue(32),
    },
    mapPlaceholderText: {
        fontSize: RFValue(12),
        fontFamily: FontFamily.regular,
        textAlign: "center",
        lineHeight: RFValue(18),
    },
});

export default ChangeHomeLocationScreen;
