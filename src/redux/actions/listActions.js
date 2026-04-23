/**
 * Lists Management Async Thunks
 * Handles all list-related API operations with optimistic updates
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";
import { requireConnectivity } from "~utils/network";

// ============================================
// 1. CREATE LIST
// POST /api/lists/create-list
// ============================================
export const createList = createAsyncThunk(
  "lists/createList",
  async (listData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/lists/create-list", listData);
      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 2. GET ALL LISTS
// GET /api/lists/get-all-list
// ============================================
export const fetchAllLists = createAsyncThunk(
  "lists/fetchAllLists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/lists/get-all-list");
      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 3. GET LIST BY ID
// GET /api/lists/get-by-id/{listId}
// ============================================
export const fetchListById = createAsyncThunk(
  "lists/fetchListById",
  async ({ listId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/lists/get-by-id/${listId}`);
      return {
        listId,
        list: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 4. ADD ITEMS TO LIST (Optimistic Update)
// POST /api/lists/add-item/{listId}
// ============================================
export const addItemsToList = createAsyncThunk(
  "lists/addItemsToList",
  async ({ listId, items }, { rejectWithValue, getState }) => {
    // Store previous list state for rollback
    const state = getState().lists;
    const previousList = state.listById[listId] || null;
    const previousLists = [...state.lists];

    try {
      const response = await axios.post(`/lists/add-item/${listId}`, { items });
      return {
        listId,
        items: response.data?.data?.items || response.data?.items || items,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous state for rollback
      return rejectWithValue({
        message,
        previousList,
        previousLists,
        listId,
      });
    }
  },
  { condition: requireConnectivity },
);

// ============================================
// 5. MARK ITEM AS PURCHASED (Optimistic Update)
// PATCH /api/lists/purchase-item/{listId}/items/{itemId}
// ============================================
export const markItemAsPurchased = createAsyncThunk(
  "lists/markItemAsPurchased",
  async ({ listId, itemId }, { rejectWithValue, getState }) => {
    // Store previous list state for rollback
    const state = getState().lists;
    const previousList = state.listById[listId] || null;
    const previousLists = [...state.lists];

    try {
      const response = await axios.put(
        `/lists/purchase-item/${listId}/items/${itemId}`,
      );
      return {
        listId,
        itemId,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous state for rollback
      return rejectWithValue({
        message,
        previousList,
        previousLists,
        listId,
        itemId,
      });
    }
  },
  { condition: requireConnectivity },
);

// ============================================
// 6. MARK ITEM AS UNPURCHASED (Optimistic Update)
// PUT /api/lists/unpurchase-item/{listId}/items/{itemId}
// ============================================
export const markItemAsUnpurchased = createAsyncThunk(
  "lists/markItemAsUnpurchased",
  async ({ listId, itemId }, { rejectWithValue, getState }) => {
    // Store previous list state for rollback
    const state = getState().lists;
    const previousList = state.listById[listId] || null;
    const previousLists = [...state.lists];

    try {
      const response = await axios.put(
        `/lists/unpurchase-item/${listId}/items/${itemId}`,
      );
      return {
        listId,
        itemId,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue({
        message,
        previousList,
        previousLists,
        listId,
        itemId,
      });
    }
  },
  { condition: requireConnectivity },
);

// ============================================
// 7. DELETE ITEM FROM LIST (Optimistic Update)
// DELETE /api/lists/delete-item/{listId}/items/{itemId}
// ============================================
export const deleteItemFromList = createAsyncThunk(
  "lists/deleteItemFromList",
  async ({ listId, itemId }, { rejectWithValue, getState }) => {
    // Store previous list state for rollback
    const state = getState().lists;
    const previousList = state.listById[listId] || null;
    const previousLists = [...state.lists];
    try {
      await axios.delete(`/lists/delete-item/${listId}/items/${itemId}`);
      return {
        listId,
        itemId,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous state for rollback
      return rejectWithValue({
        message,
        previousList,
        previousLists,
        listId,
        itemId,
      });
    }
  },
  { condition: requireConnectivity },
);

// ============================================
// 8. DELETE LIST (Optimistic Update)
// DELETE /api/lists/delete-list/{listId}
// ============================================
export const deleteList = createAsyncThunk(
  "lists/deleteList",
  async ({ listId }, { rejectWithValue, getState }) => {
    // Store previous lists for rollback
    const previousLists = [...getState().lists.lists];
    const previousListById = { ...getState().lists.listById };

    try {
      await axios.delete(`/lists/delete-list/${listId}`);
      return {
        listId,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous state for rollback
      return rejectWithValue({
        message,
        previousLists,
        previousListById,
        listId,
      });
    }
  },
  { condition: requireConnectivity },
);

// ============================================
// 10. UPDATE ITEM PRIORITY (Optimistic Update)
// PATCH /api/lists/update-item-priority/{listId}/{itemId}
// ============================================
export const updateItemPriority = createAsyncThunk(
  "lists/updateItemPriority",
  async ({ listId, itemId, priority }, { rejectWithValue, getState }) => {
    const previousList = getState().lists.listById[listId] || null;

    try {
      await axios.patch(`/lists/update-item-priority/${listId}/${itemId}`, { priority });
      return { listId, itemId, priority };
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        previousList,
        listId,
      });
    }
  },
  { condition: requireConnectivity },
);

export const fetchRecentActivities = createAsyncThunk(
  "lists/fetchRecentActivities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/activities/recent");
      console.log("response", response);
      // Handle nested data structure: response.data.data.data (array)
      const activities = response.data?.data?.data || response.data?.data || response.data;
      return Array.isArray(activities) ? activities : [];
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);
