/**
 * Lists Management Slice
 * Handles list state with optimistic updates and rollback logic
 */
import { createSlice } from "@reduxjs/toolkit";
import {
  createList,
  fetchAllLists,
  fetchListById,
  addItemsToList,
  markItemAsPurchased,
  markItemAsUnpurchased,
  deleteItemFromList,
  deleteList,
  fetchRecentActivities,
} from "../actions/listActions";
import { logout } from "./authReducer";

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

// Helper to calculate progress from items
const calculateProgress = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      total: 0,
      purchased: 0,
      percentage: 0,
      label: "0/0",
    };
  }

  const total = items.length;
  const purchased = items.filter(
    item => item.isPurchased || item.status === "purchased"
  ).length;
  const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;

  return {
    total,
    purchased,
    percentage,
    label: `${purchased}/${total}`,
  };
};

// Normalize list into listById structure
const normalizeList = (list) => {
  if (!list) return null;

  // Normalize items to ensure both isPurchased and status fields exist
  const normalizedItems = Array.isArray(list.items)
    ? list.items.map(item => ({
      ...item,
      id: item.id || item._id,
      isPurchased: item.isPurchased ?? item.status === "purchased",
      status: item.status || (item.isPurchased ? "purchased" : "pending"),
    }))
    : [];

  // Calculate progress
  const progress = calculateProgress(normalizedItems);

  return {
    ...list, // Preserve any additional fields first
    id: list.id || list._id,
    name: list.name,
    category: list.category,
    priority: list.priority,
    items: normalizedItems, // Override items with normalized version
    progress, // Add calculated progress
    createdAt: list.createdAt,
    shareWithCircle: list.shareWithCircle,
  };
};

// Normalize multiple lists
const normalizeLists = (lists) => {
  if (!Array.isArray(lists)) return { lists: [], listById: {} };

  const normalizedLists = lists.map(normalizeList).filter(Boolean);
  const listById = {};

  normalizedLists.forEach((list) => {
    const id = list.id || list._id;
    if (id) {
      listById[id] = list;
    }
  });

  return { lists: normalizedLists, listById };
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
        const { lists, listById } = normalizeLists(
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
        const { listId, list } = action.payload;
        const normalized = normalizeList(list);
        if (normalized && listId) {
          state.listById[listId] = normalized;
          // Update in lists array if it exists - create new array reference
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              normalized,
              ...state.lists.slice(listIndex + 1),
            ];
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
        const { listId, items } = action.meta.arg;
        const list = state.listById[listId];

        if (list) {
          // Create temporary items with IDs if not provided
          const newItems = items.map((item, index) => ({
            id: item.id || `temp-${Date.now()}-${index}`,
            name: item.name || item,
            isPurchased: false,
            status: "pending",
            _isOptimistic: true,
          }));

          // Optimistically add items - create new array reference
          const updatedItems = [...(list.items || []), ...newItems];
          const progress = calculateProgress(updatedItems);
          const updatedList = {
            ...list,
            items: updatedItems,
            progress, // Recalculate progress
          };
          state.listById[listId] = updatedList;

          // Update in lists array - create new array reference to trigger re-renders
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...updatedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
      })
      .addCase(addItemsToList.fulfilled, (state, action) => {
        const { listId, items: responseItems } = action.payload;
        const list = state.listById[listId];

        if (list && responseItems) {
          // Replace optimistic items with server response, ensuring both isPurchased and status
          const normalizedItems = responseItems.map(item => ({
            id: item.id || item._id,
            name: item.name,
            isPurchased: item.isPurchased ?? item.status === "purchased",
            status: item.status || (item.isPurchased ? "purchased" : "pending"),
            ...item, // Preserve other fields
          }));

          // Calculate progress
          const progress = calculateProgress(normalizedItems);
          const updatedList = { ...list, items: normalizedItems, progress };
          state.listById[listId] = updatedList;

          // Update in lists array - create new array reference to trigger re-renders
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...updatedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(addItemsToList.rejected, (state, action) => {
        const { previousList, previousLists, listId, message } =
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
        const { listId, itemId } = action.meta.arg;
        const list = state.listById[listId];

        if (list && list.items) {
          // Optimistically mark item as purchased (update both isPurchased and status)
          const updatedItems = list.items.map(item =>
            (item.id || item._id) === itemId
              ? { ...item, isPurchased: true, status: "purchased" }
              : item,
          );

          // Calculate updated progress
          const progress = calculateProgress(updatedItems);

          // Create a new list object with updated items and progress
          const updatedList = { ...list, items: updatedItems, progress };
          state.listById[listId] = updatedList;

          // Update in lists array - create new array reference to trigger re-renders
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...updatedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
      })
      .addCase(markItemAsPurchased.fulfilled, (state, action) => {
        // Item already marked optimistically
        // Optionally merge with server response if it includes additional data
        const { listId, response } = action.payload;
        const list = state.listById[listId];
        if (list) {
          // Merge any additional data from response, ensuring items are properly updated
          const mergedItems = response?.items || list.items;
          const progress = calculateProgress(mergedItems);
          const mergedList = {
            ...list,
            ...response,
            items: mergedItems,
            progress, // Recalculate progress
          };
          state.listById[listId] = mergedList;

          // Update in lists array - create new array reference to trigger re-renders
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...mergedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(markItemAsPurchased.rejected, (state, action) => {
        const { previousList, previousLists, listId, message } =
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
      // 6️⃣ MARK ITEM AS UNPURCHASED (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Mark item as pending immediately on pending
      .addCase(markItemAsUnpurchased.pending, (state, action) => {
        const { listId, itemId } = action.meta.arg;
        const list = state.listById[listId];

        if (list && list.items) {
          const updatedItems = list.items.map(item =>
            (item.id || item._id) === itemId
              ? {
                ...item,
                isPurchased: false,
                status: "pending",
                purchasedBy: null,
              }
              : item,
          );

          const progress = calculateProgress(updatedItems);
          const updatedList = { ...list, items: updatedItems, progress };
          state.listById[listId] = updatedList;

          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...updatedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
      })
      .addCase(markItemAsUnpurchased.fulfilled, (state, action) => {
        // Item already updated optimistically
        const { listId, response } = action.payload;
        const list = state.listById[listId];
        if (list) {
          const mergedItems = response?.items || list.items;
          const progress = calculateProgress(mergedItems);
          const mergedList = {
            ...list,
            ...response,
            items: mergedItems,
            progress,
          };
          state.listById[listId] = mergedList;

          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...mergedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
        state.error = null;
      })
      .addCase(markItemAsUnpurchased.rejected, (state, action) => {
        const { previousList, previousLists, listId, message } =
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
        const { listId, itemId } = action.meta.arg;
        const list = state.listById[listId];

        if (list && list.items) {
          // Optimistically remove the item - create new array reference
          const updatedItems = list.items.filter(
            item => (item.id || item._id) !== itemId,
          );
          // Recalculate progress
          const progress = calculateProgress(updatedItems);
          const updatedList = { ...list, items: updatedItems, progress };
          state.listById[listId] = updatedList;

          // Update in lists array - create new array reference to trigger re-renders
          const listIndex = state.lists.findIndex(
            l => (l.id || l._id) === listId,
          );
          if (listIndex !== -1) {
            // Create new array with updated list to ensure React re-renders
            state.lists = [
              ...state.lists.slice(0, listIndex),
              { ...updatedList },
              ...state.lists.slice(listIndex + 1),
            ];
          }
        }
      })
      .addCase(deleteItemFromList.fulfilled, (state, action) => {
        // Item already removed optimistically
        state.error = null;
      })
      // ROLLBACK: Restore previous list state on failure
      .addCase(deleteItemFromList.rejected, (state, action) => {
        const { previousList, previousLists, listId, message } =
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
        const { listId } = action.meta.arg;

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
        const { previousLists, previousListById, message } = action.payload || {};

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
      })

      // Clear list state on logout
      .addCase(logout, () => {
        return initialState;
      });
  },
});

// ============================================
// EXPORTED ACTIONS & REDUCER
// ============================================
export const { clearListsState, clearListsError } = listsSlice.actions;

export default listsSlice.reducer;
