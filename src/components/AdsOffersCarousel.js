/**
 * AdsOffersCarousel - Full-width center-focused carousel for ads & offers.
 *
 * The active (center) card is magnified; neighbouring cards are scaled down
 * and slightly transparent, giving a smooth "spotlight" effect as the user
 * scrolls. Uses Animated.ScrollView with scroll-position interpolation for
 * buttery-smooth 60fps animations driven on the native thread.
 */
import React, { useRef, useState, useCallback, memo } from "react";
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    ImageBackground,
    TouchableOpacity,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Layout constants ────────────────────────────────────────────────────────────
const CARD_WIDTH = SCREEN_WIDTH * 0.85; // visible card width
const CARD_SPACING = RFValue(2); // gap between cards
const SIDE_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_SPACING / 2; // account for card margin
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
const CARD_HEIGHT = RFValue(160);

// Animation tuning
const ACTIVE_SCALE = 1.0;
const INACTIVE_SCALE = 0.88;
const ACTIVE_OPACITY = 1;
const INACTIVE_OPACITY = 0.6;

// ============================================
// AD CARD COMPONENT
// ============================================
const AdCard = memo(({ item, index, scrollX, onPress }) => {
    const { colors } = useTheme();

    // Interpolations driven by scroll position
    const inputRange = [
        (index - 1) * SNAP_INTERVAL,
        index * SNAP_INTERVAL,
        (index + 1) * SNAP_INTERVAL,
    ];

    const scale = scrollX.interpolate({
        inputRange,
        outputRange: [INACTIVE_SCALE, ACTIVE_SCALE, INACTIVE_SCALE],
        extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [INACTIVE_OPACITY, ACTIVE_OPACITY, INACTIVE_OPACITY],
        extrapolate: "clamp",
    });

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                { transform: [{ scale }], opacity },
            ]}>
            <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => onPress?.(item)}
                style={styles.cardContainer}>
                <ImageBackground
                    source={
                        typeof item.image === "string"
                            ? { uri: item.image }
                            : item.image
                    }
                    style={styles.cardImage}
                    imageStyle={styles.cardImageStyle}
                    resizeMode="cover">
                    {/* Gradient overlay for text legibility */}
                    <View style={styles.gradientOverlay}>
                        <View style={styles.cardContent}>
                            {/* Title pill */}
                            <View
                                style={[
                                    styles.titlePill,
                                    { backgroundColor: "#2563EB" },
                                ]}>
                                <Text style={styles.titleText}>
                                    {item.title}
                                </Text>
                            </View>

                            {/* Subtitle */}
                            {item.subtitle && (
                                <Text
                                    style={styles.subtitleText}
                                    numberOfLines={2}>
                                    {item.subtitle}
                                </Text>
                            )}
                        </View>
                    </View>
                </ImageBackground>
            </TouchableOpacity>
        </Animated.View>
    );
});

// ============================================
// DOT PAGINATION
// ============================================
const DotPagination = memo(({ total, activeIndex, colors }) => (
    <View style={styles.paginationContainer}>
        {Array.from({ length: total }).map((_, i) => (
            <View
                key={i}
                style={[
                    styles.dot,
                    {
                        backgroundColor:
                            i === activeIndex ? colors.primary : colors.border,
                        width: i === activeIndex ? RFValue(16) : RFValue(6),
                    },
                ]}
            />
        ))}
    </View>
));

// ============================================
// MAIN CAROUSEL
// ============================================
const AdsOffersCarousel = ({
    data = [],
    title = "Ads & Offers",
    showTitle = true,
    onAdPress,
    autoPlay = false,
    autoPlayInterval = 8000,
}) => {
    const { colors } = useTheme();
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const autoPlayRef = useRef(null);

    // Track active index from scroll position
    const onMomentumScrollEnd = useCallback(
        (event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SNAP_INTERVAL);
            setActiveIndex(Math.max(0, Math.min(index, data.length - 1)));
        },
        [data.length],
    );

    // Auto-play
    React.useEffect(() => {
        if (autoPlay && data.length > 1) {
            autoPlayRef.current = setInterval(() => {
                setActiveIndex((prev) => {
                    const next = (prev + 1) % data.length;
                    scrollViewRef.current?.scrollTo({
                        x: next * SNAP_INTERVAL,
                        animated: true,
                    });
                    return next;
                });
            }, autoPlayInterval);

            return () => {
                if (autoPlayRef.current) clearInterval(autoPlayRef.current);
            };
        }
    }, [autoPlay, autoPlayInterval, data.length]);

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section title */}
            {showTitle && (
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: colors.textPrimary },
                    ]}>
                    {title}
                </Text>
            )}

            {/* Carousel */}
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: SIDE_INSET,
                }}
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                bounces={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true },
                )}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}>
                {data.map((item, index) => (
                    <AdCard
                        key={item.id?.toString() || index.toString()}
                        item={item}
                        index={index}
                        scrollX={scrollX}
                        onPress={onAdPress}
                    />
                ))}
            </Animated.ScrollView>

            {/* Dot pagination */}
            {data.length > 1 && (
                <DotPagination
                    total={data.length}
                    activeIndex={activeIndex}
                    colors={colors}
                />
            )}
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        marginVertical: RFValue(8),
    },
    sectionTitle: {
        fontSize: RFValue(13),
        fontFamily: FontFamily.bold,
        marginBottom: RFValue(12),
        paddingHorizontal: RFValue(16),
    },

    // Card wrapper (receives animated scale + opacity)
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginHorizontal: CARD_SPACING / 2,
    },
    cardContainer: {
        flex: 1,
        borderRadius: RFValue(16),
        overflow: "hidden",
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    cardImageStyle: {
        borderRadius: RFValue(16),
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: RFValue(16),
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        borderRadius: RFValue(16),
    },
    cardContent: {
        alignItems: "center",
    },
    titlePill: {
        paddingHorizontal: RFValue(16),
        borderRadius: RFValue(4),
        marginBottom: RFValue(8),
    },
    titleText: {
        color: "#FFFFFF",
        fontSize: RFValue(12),
        fontFamily: FontFamily.semiBold,
    },
    subtitleText: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: RFValue(11),
        fontFamily: FontFamily.regular,
        lineHeight: RFValue(16),
        textAlign: "center",
    },

    // Pagination
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: RFValue(12),
        gap: RFValue(4),
    },
    dot: {
        height: RFValue(6),
        borderRadius: RFValue(3),
    },
});

export default memo(AdsOffersCarousel);
