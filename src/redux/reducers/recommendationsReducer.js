/**
 * Recommendations Redux Slice
 *
 * State shape:
 *   items       – full accumulated list (used by AIRecommendations screen with pagination)
 *   homeItems   – first 2 items snapshot (used by Home screen "For You" section)
 *   loading     – initial/first-page load indicator
 *   loadingMore – pagination load indicator
 *   error       – last error message
 *   page        – current page
 *   hasMore     – whether more pages exist
 */

import { createSlice } from "@reduxjs/toolkit";
import { fetchPersonalizedRecommendations } from "../actions/recommendationsActions";

const initialState = {
  items: [],
  homeItems: [],
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
};

const recommendationsSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    resetRecommendations(state) {
      state.items = [];
      state.homeItems = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalizedRecommendations.pending, (state, action) => {
        const isFirstPage = action.meta.arg?.page === 1 || action.meta.arg?.page == null;
        if (isFirstPage) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchPersonalizedRecommendations.fulfilled, (state, action) => {
        const { recommendations, page, hasMore } = action.payload;
        state.loading = false;
        state.loadingMore = false;
        state.page = page;
        state.hasMore = hasMore;

        if (page === 1) {
          // First page: replace list and update home snapshot (first 2 items)
          state.items = recommendations;
          state.homeItems = recommendations.slice(0, 2);
        } else {
          // Subsequent pages: accumulate
          state.items = [...state.items, ...recommendations];
        }
      })
      .addCase(fetchPersonalizedRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload ?? "Failed to load recommendations";
      });
  },
});

export const { resetRecommendations } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
