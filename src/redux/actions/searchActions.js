import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "~utils";
import axios from "~utils/axiosInstance";

/**
 * Search local stores near the user
 * GET /search/stores?query={query}&lat={lat}&lng={lng}&page={page}&limit={limit}
 */
export const searchLocalStores = createAsyncThunk(
  "search/searchLocalStores",
  async ({ query, lat, lng, page = 1, limit = 10, silent = false }, { rejectWithValue }) => {
    try {
      if (!query?.trim()) {
        return rejectWithValue("Search query is required");
      }

      const params = {
        query: query.trim(),
        page: page,
        limit: limit,
        silent: silent
      };
      if (lat != null && lng != null) {
        params.lat = lat;
        params.lng = lng;
      }

      const response = await axios.get("/search/stores", { params });

      const data = response.data;

      return {
        results: Array.isArray(data?.data) ? data.data : [],
        count: data?.count ?? 0,
        page: page,
        limit: limit,
        hasMore: Array.isArray(data?.data) && data.data.length === limit,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

/**
 * Search online stores
 * GET /search/online?query={query}&page={page}&limit={limit}
 */
export const searchOnlineStores = createAsyncThunk(
  "search/searchOnlineStores",
  async ({ query, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      if (!query?.trim()) {
        return rejectWithValue("Search query is required");
      }

      const response = await axios.get("/search/online", {
        params: {
          query: query.trim(),
          page: page,
          limit: limit,
        },
      });
      console.log("response", response);
      const data = response.data;
      console.log("data", data);

      return {
        results: Array.isArray(data?.data) ? data.data : [],
        count: data?.count ?? 0,
        page: page,
        limit: limit,
        hasMore: Array.isArray(data?.data) && data.data.length === limit,
      };
    } catch (err) {
      console.log("err", err);
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);
/**
 * Fetch banners by placement
 * GET /banners/get-banner?placement={placement}
 */
export const fetchBanners = createAsyncThunk(
  "search/fetchBanners",
  async ({ placement = "home" }, { rejectWithValue }) => {
    try {
      if (!placement) {
        return rejectWithValue("Placement is required");
      }

      const response = await axios.get(`/banners/get-banners/?placement=${placement}`);
      console.log(`response fetchBanners (${placement})`, response);
      
      const data = response.data;
      return {
        placement,
        banners: Array.isArray(data?.data) ? data.data : [],
      };
    } catch (err) {
      console.log("err fetchBanners", err);
    }
  },
);

/**
 * Fetch Recent Searches
 * GET /search/recent
 */
export const fetchRecentSearches = createAsyncThunk(
  "search/fetchRecentSearches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/search/recent");
      console.log("response fetchRecentSearches", response.data);
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (err) {
      console.log("err fetchRecentSearches", err);

      const errorData = err.response;
      console.log("errorData fetchRecentSearches", errorData);

      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  }
);

/**
 * Clear Recent Searches
 * DELETE /search/recent
 */
export const clearRecentSearches = createAsyncThunk(
  "search/clearRecentSearches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete("/search/recent");
      console.log("response clearRecentSearches", response.data);
      return true; // return success
    } catch (err) {
      console.log("err clearRecentSearches", err);
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch Trending Searches
 * GET /search/trending
 */
export const fetchTrendingSearches = createAsyncThunk(
  "search/fetchTrendingSearches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/search/trending");
      console.log("response fetchTrendingSearches", response.data);
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (err) {
      console.log("err fetchTrendingSearches", err);
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  }
);
