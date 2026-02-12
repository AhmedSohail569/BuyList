/**
 * Geocoding Utilities
 * Centralized Google Geocoding API integration
 * Used across the app for forward and reverse geocoding
 */

import Config from "react-native-config";

// Google Maps Geocoding API config
const GOOGLE_GEOCODING_BASE = "https://maps.googleapis.com/maps/api";

/**
 * Forward geocode: address string → list of results
 * Uses Google Places Autocomplete API for better UX
 */
export const forwardGeocode = async (query) => {

    console.log("Config", Config.GOOGLE_MAPS_API_KEY);
    try {
        const url = `${GOOGLE_GEOCODING_BASE}/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${Config.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            console.error("Google Geocoding error:", data.status, data.error_message);
            return [];
        }
        
        // Get place details for each prediction to get coordinates
        const detailsPromises = (data.predictions || []).slice(0, 5).map(async (prediction) => {
            try {
                const detailUrl = `${GOOGLE_GEOCODING_BASE}/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address,address_components&key=${Config.GOOGLE_MAPS_API_KEY}`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();
                
                if (detailData.status === "OK" && detailData.result) {
                    return {
                        place_id: prediction.place_id,
                        display_name: prediction.description,
                        formatted_address: detailData.result.formatted_address,
                        lat: detailData.result.geometry.location.lat,
                        lon: detailData.result.geometry.location.lng,
                        address_components: detailData.result.address_components,
                    };
                }
                return null;
            } catch (err) {
                console.error("Error fetching place details:", err);
                return null;
            }
        });
        
        const results = await Promise.all(detailsPromises);
        return results.filter(Boolean);
    } catch (err) {
        console.error("Forward geocoding error:", err);
        return [];
    }
};

/**
 * Reverse geocode: lat/lng → address object with components
 * Uses Google Reverse Geocoding API - much more reliable than Nominatim
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const url = `${GOOGLE_GEOCODING_BASE}/geocode/json?latlng=${lat},${lng}&key=${Config.GOOGLE_MAPS_API_KEY}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            const statusText = res.statusText || 'Unknown error';
            console.error(`Reverse geocoding failed: HTTP ${res.status} - ${statusText}`);
            throw new Error(`Reverse geocoding failed: ${statusText}`);
        }
        
        const data = await res.json();
        
        if (data.status !== "OK") {
            console.error("Google Reverse Geocoding error:", data.status, data.error_message);
            
            if (data.status === "ZERO_RESULTS") {
                throw new Error("No address found for this location");
            } else if (data.status === "OVER_QUERY_LIMIT") {
                throw new Error("Rate limit exceeded. Please try again later.");
            } else {
                throw new Error(data.error_message || "Geocoding failed");
            }
        }
        
        // Return the most specific result (first one)
        const result = data.results[0];
        if (!result) {
            throw new Error("No address found for this location");
        }
        
        return {
            display_name: result.formatted_address,
            formatted_address: result.formatted_address,
            address_components: result.address_components,
            place_id: result.place_id,
        };
    } catch (err) {
        console.error("Reverse geocoding error:", err);
        throw err;
    }
};

/**
 * Extract specific address component from Google's address_components array
 * @param {Array} addressComponents - Google's address_components array
 * @param {Array<string>} types - Array of type strings to search for (in priority order)
 * @returns {string} The component's long_name or empty string
 */
export const getAddressComponent = (addressComponents, types) => {
    if (!addressComponents || !Array.isArray(addressComponents)) return "";
    
    for (const type of types) {
        const component = addressComponents.find(c => c.types.includes(type));
        if (component) return component.long_name;
    }
    return "";
};

/**
 * Extract city from Google address_components
 */
export const getCityFromComponents = (addressComponents) => {
    return getAddressComponent(addressComponents, [
        "locality",
        "administrative_area_level_2",
        "administrative_area_level_1"
    ]);
};

/**
 * Extract area/neighborhood from Google address_components
 */
export const getAreaFromComponents = (addressComponents) => {
    return getAddressComponent(addressComponents, [
        "sublocality",
        "sublocality_level_1",
        "neighborhood"
    ]);
};

/**
 * Format a Google Geocoding result into a readable address string
 */
export const formatAddress = (result) => {
    console.log("result", result);
    if (!result) return "";
    
    // Google already provides a well-formatted address
    if (result.formatted_address) {
        return result.formatted_address;
    }
    
    // Fallback: construct from address_components
    if (result.address_components) {
        const parts = [
            getAddressComponent(result.address_components, ["street_number"]) + 
                " " + 
                getAddressComponent(result.address_components, ["route"]),
            getAddressComponent(result.address_components, ["locality", "sublocality"]),
            getAddressComponent(result.address_components, ["administrative_area_level_1"]),
        ].filter(Boolean);
        
        return parts.join(", ");
    }
    
    return result.display_name || "";
};
