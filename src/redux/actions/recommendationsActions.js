import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "~utils";
import axios from "~utils/axiosInstance";

/**
 * Fetch AI-powered personalized recommendations
 * GET /recommendations/personalized?page={page}&limit={limit}
 */
export const fetchPersonalizedRecommendations = createAsyncThunk(
  "recommendations/fetchPersonalized",
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get("/recommendations/personalized", {
        params: { page, limit },
      });

      console.log("response", response)

      const data = response.data;

      console.log("data", data)

      const recommendations = Array.isArray(data?.data?.data)
        ? data.data.data
        : [];
      console.log("recommendations", recommendations)
      return {
        recommendations,
        page,
        limit,
        hasMore: recommendations.length === limit,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);
