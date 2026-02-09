/**
 * AdsOffersCarousel - Reusable carousel component for ads and promotional offers
 * Features smooth horizontal scrolling with dot pagination
 */
import React, { useRef, useState, useCallback, memo } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    Dimensions,
    ImageBackground,
    TouchableOpacity,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Text } from "~components/Common";
import { useTheme } from "~context/ThemeContext";
import { FontFamily } from "~theme/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_SIDE_INSET = RFValue(16);
const CARD_WIDTH = SCREEN_WIDTH - CAROUSEL_SIDE_INSET * 2;
const CARD_HEIGHT = RFValue(160);

// ============================================
// AD CARD COMPONENT
// ============================================
const AdCard = memo(({ item, onPress }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => onPress?.(item)}
            style={styles.cardContainer}>
            <ImageBackground
                source={
                    typeof item.image === "string" ? { uri: item.image } : item.image
                }
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover">
                {/* Gradient overlay for better text visibility */}
                <View style={styles.gradientOverlay}>
                    <View style={styles.cardContent}>
                        {/* Title pill/button */}
                        <View style={[styles.titlePill, { backgroundColor: "#2563EB" }]}>
                            <Text style={styles.titleText}>{item.title}</Text>
                        </View>

                        {/* Subtitle */}
                        {item.subtitle && (
                            <Text style={styles.subtitleText} numberOfLines={2}>
                                {item.subtitle}
                            </Text>
                        )}
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
});

// ============================================
// DOT PAGINATION COMPONENT
// ============================================
const DotPagination = memo(({ total, activeIndex, colors }) => {
    return (
        <View style={styles.paginationContainer}>
            {Array.from({ length: total }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor:
                                index === activeIndex ? colors.primary : colors.border,
                            width: index === activeIndex ? RFValue(16) : RFValue(6),
                        },
                    ]}
                />
            ))}
        </View>
    );
});

// ============================================
// MAIN CAROUSEL COMPONENT
// ============================================
const AdsOffersCarousel = ({
    data = [],
    title = "Ads & Offers",
    showTitle = true,
    onAdPress,
    autoPlay = false,
    autoPlayInterval = 4000,
}) => {
    const { colors } = useTheme();
    const flatListRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const autoPlayRef = useRef(null);

    // Handle scroll end to update active index
    const onMomentumScrollEnd = useCallback(
        (event) => {
            const contentOffset = event.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffset / CARD_WIDTH);
            setActiveIndex(Math.max(0, Math.min(index, data.length - 1)));
        },
        [data.length],
    );

    // Auto-play functionality
    React.useEffect(() => {
        if (autoPlay && data.length > 1) {
            autoPlayRef.current = setInterval(() => {
                setActiveIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % data.length;
                    flatListRef.current?.scrollToIndex({
                        index: nextIndex,
                        animated: true,
                    });
                    return nextIndex;
                });
            }, autoPlayInterval);

            return () => {
                if (autoPlayRef.current) {
                    clearInterval(autoPlayRef.current);
                }
            };
        }
    }, [autoPlay, autoPlayInterval, data.length]);

    // Render individual ad card
    const renderItem = useCallback(
        ({ item }) => <AdCard item={item} onPress={onAdPress} />,
        [onAdPress],
    );

    // Key extractor
    const keyExtractor = useCallback(
        (item, index) => item.id?.toString() || index.toString(),
        [],
    );

    // Get item layout for better scroll performance
    const getItemLayout = useCallback(
        (_, index) => ({
            length: CARD_WIDTH,
            offset: CARD_WIDTH * index,
            index,
        }),
        [],
    );

    // Don't render if no data
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Section Title */}
            {showTitle && (
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {title}
                </Text>
            )}

            {/* Carousel */}
            <FlatList
                ref={flatListRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={onMomentumScrollEnd}
                getItemLayout={getItemLayout}
                bounces={false}
            />

            {/* Dot Pagination */}
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
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
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
        // paddingVertical: RFValue(2),
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
