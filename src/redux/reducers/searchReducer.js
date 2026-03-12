import { createSlice } from "@reduxjs/toolkit";
import {
  searchLocalStores,
  searchOnlineStores,
  fetchBanners,
  fetchRecentSearches,
  clearRecentSearches,
  fetchTrendingSearches,
} from "../actions/searchActions";
import { logout } from "./authReducer";

const initialState = {
  // Online stores
  onlineResults: [],
  onlineCount: 0,
  onlineLoading: false,
  onlineLoadingMore: false,
  onlineError: null,
  onlinePage: 1,
  onlineHasMore: false,

  // Local stores
  localResults: [],
  localCount: 0,
  localLoading: false,
  localLoadingMore: false,
  localError: null,
  localPage: 1,
  localHasMore: false,

  // Banners
  homeBanners: [],
  searchBanners: [],
  bannersLoading: false,
  bannersError: null,

  // Recent & Trending
  recentSearches: [],
  recentLoading: false,
  recentError: null,
  trendingSearches: [],
  trendingLoading: false,
  trendingError: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.onlineResults = [];
      state.onlineCount = 0;
      state.onlineError = null;
      state.onlinePage = 1;
      state.onlineHasMore = false;
      state.localResults = [];
      state.localCount = 0;
      state.localError = null;
      state.localPage = 1;
      state.localHasMore = false;
    },
    clearOnlineResults(state) {
      state.onlineResults = [];
      state.onlineCount = 0;
      state.onlineError = null;
      state.onlinePage = 1;
      state.onlineHasMore = false;
    },
    clearLocalResults(state) {
      state.localResults = [];
      state.localCount = 0;
      state.localError = null;
      state.localPage = 1;
      state.localHasMore = false;
    },
    clearSearchErrors(state) {
      state.onlineError = null;
      state.localError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // SEARCH ONLINE STORES
      // ============================================
      .addCase(searchOnlineStores.pending, (state, action) => {
        const isFirstPage = action.meta.arg.page === 1;
        if (isFirstPage) {
          state.onlineLoading = true;
          state.onlineResults = [];
          state.onlinePage = 1;
        } else {
          state.onlineLoadingMore = true;
        }
        state.onlineError = null;
      })
      .addCase(searchOnlineStores.fulfilled, (state, action) => {
        const { results, page, hasMore } = action.payload;
        state.onlineLoading = false;
        state.onlineLoadingMore = false;
        state.onlinePage = page;
        state.onlineHasMore = hasMore;
        state.onlineCount = action.payload.count;

        if (page === 1) {
          state.onlineResults = results;
        } else {
          state.onlineResults = [...state.onlineResults, ...results];
        }
      })
      .addCase(searchOnlineStores.rejected, (state, action) => {
        state.onlineLoading = false;
        state.onlineLoadingMore = false;
        state.onlineError = action.payload;
      })

      // ============================================
      // SEARCH LOCAL STORES
      // ============================================
      .addCase(searchLocalStores.pending, (state, action) => {
        const isFirstPage = action.meta.arg.page === 1;
        if (isFirstPage) {
          state.localLoading = true;
          state.localResults = [];
          state.localPage = 1;
        } else {
          state.localLoadingMore = true;
        }
        state.localError = null;
      })
      .addCase(searchLocalStores.fulfilled, (state, action) => {
        const { results, page, hasMore } = action.payload;
        state.localLoading = false;
        state.localLoadingMore = false;
        state.localPage = page;
        state.localHasMore = hasMore;
        state.localCount = action.payload.count;

        if (page === 1) {
          state.localResults = results;
        } else {
          state.localResults = [...state.localResults, ...results];
        }
      })
      .addCase(searchLocalStores.rejected, (state, action) => {
        state.localLoading = false;
        state.localLoadingMore = false;
        state.localError = action.payload;
      })

      // ============================================
      // BANNERS
      // ============================================
      .addCase(fetchBanners.pending, (state) => {
        state.bannersLoading = true;
        state.bannersError = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.bannersLoading = false;
        const { placement, banners } = action.payload;
        if (placement === "home") {
          state.homeBanners = banners;
        } else if (placement === "search") {
          state.searchBanners = banners;
        }
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.bannersLoading = false;
        state.bannersError = action.payload;
      })

      // ============================================
      // RECENT SEARCHES
      // ============================================
      .addCase(fetchRecentSearches.pending, (state) => {
        state.recentLoading = true;
        state.recentError = null;
      })
      .addCase(fetchRecentSearches.fulfilled, (state, action) => {
        state.recentLoading = false;
        state.recentSearches = action.payload;
      })
      .addCase(fetchRecentSearches.rejected, (state, action) => {
        state.recentLoading = false;
        state.recentError = action.payload;
      })
      .addCase(clearRecentSearches.fulfilled, (state) => {
        state.recentSearches = [];
      })

      // ============================================
      // TRENDING SEARCHES
      // ============================================
      .addCase(fetchTrendingSearches.pending, (state) => {
        state.trendingLoading = true;
        state.trendingError = null;
      })
      .addCase(fetchTrendingSearches.fulfilled, (state, action) => {
        state.trendingLoading = false;
        state.trendingSearches = action.payload;
      })
      .addCase(fetchTrendingSearches.rejected, (state, action) => {
        state.trendingLoading = false;
        state.trendingError = action.payload;
      })

      // Clear on logout
      .addCase(logout, () => {
        return initialState;
      });
  },
});

export const {
  clearSearchResults,
  clearOnlineResults,
  clearLocalResults,
  clearSearchErrors,
} = searchSlice.actions;

export default searchSlice.reducer;
