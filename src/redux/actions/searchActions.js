import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "~utils";
import axios from "~utils/axiosInstance";

/**
 * Search local stores near the user
 * GET /search/stores?query={query}&lat={lat}&lng={lng}&page={page}&limit={limit}
 */
export const searchLocalStores = createAsyncThunk(
  "search/searchLocalStores",
  async ({ query, lat, lng, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      if (!query?.trim()) {
        return rejectWithValue("Search query is required");
      }

      const params = {
        query: query.trim(),
        page: page,
        limit: limit,
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
