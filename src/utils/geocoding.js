/**
 * Geocoding Utilities
 * Centralized Google Geocoding API integration
 * Used across the app for forward and reverse geocoding
 */
import Config from "react-native-config";

const GOOGLE_GEOCODING_BASE = "https://maps.googleapis.com/maps/api";

/**
 * Geocode a single address string → { lat, lon, display_name, formatted_address, address_components }
 * Uses the Google Geocoding API directly, which supports Plus Codes (Open Location Codes).
 * Returns null on failure.
 */
export const geocodeAddress = async (address) => {
  try {
    const url = `${GOOGLE_GEOCODING_BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${Config.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      display_name: result.formatted_address,
      formatted_address: result.formatted_address,
      address_components: result.address_components,
    };
  } catch {
    return null;
  }
};

/**
 * Forward geocode: address string → list of results
 * Uses Google Places Autocomplete → Place Details for coordinates
 */
export const forwardGeocode = async (query) => {
  try {
    const url = `${GOOGLE_GEOCODING_BASE}/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${Config.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];

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
      } catch {
        return null;
      }
    });

    const results = await Promise.all(detailsPromises);
    return results.filter(Boolean);
  } catch {
    return [];
  }
};

/**
 * Reverse geocode: lat/lng → address object with components
 * Uses Google Reverse Geocoding API
 */
export const reverseGeocode = async (lat, lng) => {
  const url = `${GOOGLE_GEOCODING_BASE}/geocode/json?latlng=${lat},${lng}&key=${Config.GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Reverse geocoding failed: ${res.statusText || "Unknown error"}`);
  }

  const data = await res.json();

  if (data.status !== "OK") {
    if (data.status === "ZERO_RESULTS") {
      throw new Error("No address found for this location");
    } else if (data.status === "OVER_QUERY_LIMIT") {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(data.error_message || "Geocoding failed");
  }

  const result = data.results[0];
  if (!result) throw new Error("No address found for this location");

  return {
    display_name: result.formatted_address,
    formatted_address: result.formatted_address,
    address_components: result.address_components,
    place_id: result.place_id,
  };
};

// ── Address Component Extraction ───────────────────────────────────────────────

/**
 * Extract specific address component from Google's address_components array
 * @param {Array} addressComponents - Google's address_components array
 * @param {Array<string>} types - Type strings to search for (in priority order)
 * @returns {string} The component's long_name or empty string
 */
export const getAddressComponent = (addressComponents, types) => {
  if (!Array.isArray(addressComponents)) return "";

  for (const type of types) {
    const component = addressComponents.find((c) => c.types.includes(type));
    if (component) return component.long_name;
  }
  return "";
};

/** Extract city from Google address_components */
export const getCityFromComponents = (addressComponents) =>
  getAddressComponent(addressComponents, [
    "locality",
    "administrative_area_level_2",
    "administrative_area_level_1",
  ]);

/** Extract area/neighborhood from Google address_components */
export const getAreaFromComponents = (addressComponents) =>
  getAddressComponent(addressComponents, [
    "sublocality",
    "sublocality_level_1",
    "neighborhood",
  ]);

/**
 * Format a geocoding result into a readable address string
 */
export const formatAddress = (result) => {
  if (!result) return "";

  if (result.formatted_address) return result.formatted_address;

  // Fallback: construct from address_components
  if (result.address_components) {
    const parts = [
      `${getAddressComponent(result.address_components, ["street_number"])} ${getAddressComponent(result.address_components, ["route"])}`.trim(),
      getAddressComponent(result.address_components, ["locality", "sublocality"]),
      getAddressComponent(result.address_components, ["administrative_area_level_1"]),
    ].filter(Boolean);
    return parts.join(", ");
  }

  return result.display_name || "";
};
