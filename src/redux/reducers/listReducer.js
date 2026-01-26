/**
 * Lists Management Slice
 * Handles list state with optimistic updates and rollback logic
 */
import {createSlice} from "@reduxjs/toolkit";
import {
  createList,
  fetchAllLists,
  fetchListById,
  addItemsToList,
  markItemAsPurchased,
  deleteItemFromList,
  deleteList,
  fetchRecentActivities,
} from "../actions/listActions";

// ============================================
// INITIAL STATE
// ============================================
const initialState = {
  // Array of all lists
  lists: [],

  // Normalized list lookup by ID for efficient access
  listById: {},

  // Recent activities feed
  recentActivities: [],

  // Loading states
  loading: false,
  activitiesLoading: false,

  // Error state
  error: null,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Normalize list into listById structure
const normalizeList = (list) => {
  if (!list) return null;
  return {
    id: list.id || list._id,
    name: list.name,
    category: list.category,
    priority: list.priority,
    items: Array.isArray(list.items) ? list.items : [],
    createdAt: list.createdAt,
    shareWithCircle: list.shareWithCircle,
    ...list, // Preserve any additional fields
  };
};

// Normalize multiple lists
const normalizeLists = (lists) => {
  if (!Array.isArray(lists)) return {lists: [], listById: {}};

  const normalizedLists = lists.map(normalizeList).filter(Boolean);
  const listById = {};

  normalizedLists.forEach((list) => {
    const id = list.id || list._id;
    if (id) {
      listById[id] = list;
    }
  });

  return {lists: normalizedLists, listById};
};

// ============================================
// SLICE DEFINITION
// ============================================
const listsSlice = createSlice({
  name: "lists",
  initialState,
  reducers: {
    // Clear all list state (e.g., on logout)
    clearListsState(state) {
      return initialState;
    },

    // Clear error state
    clearListsError(state) {
      state.error = null;
    },
  },

  extraReducers: builder => {
    builder
      // ============================================
      // 1️⃣ CREATE LIST
      // ============================================
      .addCase(createList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.loading = false;
        const normalized = normalizeList(action.payload);
        if (normalized) {
          const id = normalized.id || normalized._id;
          state.lists.push(normalized);
          if (id) {
            state.listById[id] = normalized;
          }
        }
      })
      .addCase(createList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 2️⃣ FETCH ALL LISTS
      // ============================================
      .addCase(fetchAllLists.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLists.fulfilled, (state, action) => {
        state.loading = false;
        const {lists, listById} = normalizeLists(
          Array.isArray(action.payload) ? action.payload : [],
        );
        state.lists = lists;
        state.listById = listById;
      })
      .addCase(fetchAllLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 3️⃣ FETCH LIST BY ID
      // ============================================
      .addCase(fetchListById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchListById.fulfilled, (state, action) => {
        state.loading = false;
        const {listId, list} = action.payload;
        const normalized = normalizeList(list);
        if (normalized && listId) {
          state.listById[listId] = normalized;
          // Update in lists array if it exists
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists[listIndex] = normalized;
          } else {
            state.lists.push(normalized);
          }
        }
      })
      .addCase(fetchListById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 4️⃣ ADD ITEMS TO LIST (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Add items immediately on pending
      .addCase(addItemsToList.pending, (state, action) => {
        const {listId, items} = action.meta.arg;
        const list = state.listById[listId];

        if (list) {
          // Create temporary items with IDs if not provided
          const newItems = items.map((item, index) => ({
            id: item.id || `temp-${Date.now()}-${index}`,
            name: item.name || item,
            isPurchased: false,
            _isOptimistic: true,
          }));

          // Optimistically add items
          list.items = [...(list.items || []), ...newItems];

          // Update in lists array
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists[listIndex] = {...list};
          }
        }
      })
      .addCase(addItemsToList.fulfilled, (state, action) => {
        const {listId, items: responseItems} = action.payload;
        const list = state.listById[listId];

        if (list && responseItems) {
          // Replace optimistic items with server response
          list.items = responseItems.map(item => ({
            id: item.id || item._id,
            name: item.name,
            isPurchased: item.isPurchased || false,
          }));

          // Update in lists array
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists[listIndex] = {...list};
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(addItemsToList.rejected, (state, action) => {
        const {previousList, previousLists, listId, message} =
          action.payload || {};

        if (listId && previousList) {
          state.listById[listId] = previousList;
        }
        if (previousLists) {
          state.lists = previousLists;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 5️⃣ MARK ITEM AS PURCHASED (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Mark item as purchased immediately on pending
      .addCase(markItemAsPurchased.pending, (state, action) => {
        const {listId, itemId} = action.meta.arg;
        const list = state.listById[listId];

        if (list && list.items) {
          // Optimistically mark item as purchased
          list.items = list.items.map(item =>
            (item.id || item._id) === itemId
              ? {...item, isPurchased: true}
              : item,
          );

          // Update in lists array
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists[listIndex] = {...list};
          }
        }
      })
      .addCase(markItemAsPurchased.fulfilled, (state, action) => {
        // Item already marked optimistically
        // Optionally merge with server response if it includes additional data
        const {listId, response} = action.payload;
        if (response) {
          const list = state.listById[listId];
          if (list) {
            // Merge any additional data from response
            Object.assign(list, response);
            // Update in lists array
            const listIndex = state.lists.findIndex(
              l => (l.id || l._id) === listId,
            );
            if (listIndex !== -1) {
              state.lists[listIndex] = {...list};
            }
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(markItemAsPurchased.rejected, (state, action) => {
        const {previousList, previousLists, listId, message} =
          action.payload || {};

        if (listId && previousList) {
          state.listById[listId] = previousList;
        }
        if (previousLists) {
          state.lists = previousLists;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 6️⃣ DELETE ITEM FROM LIST (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Remove item immediately on pending
      .addCase(deleteItemFromList.pending, (state, action) => {
        const {listId, itemId} = action.meta.arg;
        const list = state.listById[listId];

        if (list && list.items) {
          // Optimistically remove the item
          list.items = list.items.filter(
            item => (item.id || item._id) !== itemId,
          );

          // Update in lists array
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists[listIndex] = {...list};
          }
        }
      })
      .addCase(deleteItemFromList.fulfilled, (state, action) => {
        // Item already removed optimistically
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(deleteItemFromList.rejected, (state, action) => {
        const {previousList, previousLists, listId, message} =
          action.payload || {};

        if (listId && previousList) {
          state.listById[listId] = previousList;
        }
        if (previousLists) {
          state.lists = previousLists;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 7️⃣ DELETE LIST (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Remove list immediately on pending
      .addCase(deleteList.pending, (state, action) => {
        const {listId} = action.meta.arg;

        // Optimistically remove from lists array
        state.lists = state.lists.filter(
          list => (list.id || list._id) !== listId,
        );

        // Optimistically remove from listById
        if (state.listById[listId]) {
          delete state.listById[listId];
        }
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        // List already removed optimistically
        state.error = null;
      })
      // ROLLBACK: Restore previous lists on failure
      .addCase(deleteList.rejected, (state, action) => {
        const {previousLists, previousListById, message} = action.payload || {};

        if (previousLists) {
          state.lists = previousLists;
        }
        if (previousListById) {
          state.listById = previousListById;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 8️⃣ FETCH RECENT ACTIVITIES
      // ============================================
      .addCase(fetchRecentActivities.pending, state => {
        state.activitiesLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.activitiesLoading = false;
        state.recentActivities = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.activitiesLoading = false;
        state.error = action.payload;
      });
  },
});

// ============================================
// EXPORTED ACTIONS & REDUCER
// ============================================
export const {clearListsState, clearListsError} = listsSlice.actions;

export default listsSlice.reducer;
