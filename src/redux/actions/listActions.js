/**
 * Lists Management Async Thunks
 * Handles all list-related API operations with optimistic updates
 */
import {createAsyncThunk} from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import {getErrorMessage} from "~utils";
import {requireConnectivity} from "~utils/network";

// ============================================
// 1. CREATE LIST
// POST /api/lists/create-list
// ============================================
export const createList = createAsyncThunk(
  "lists/createList",
  async (listData, {rejectWithValue, getState}) => {
    try {
      const response = await axios.post("/lists/create-list", listData);
      const newList = response.data?.data || response.data;

      // The API returns circle as an unpopulated ID — enrich it from
      // pickerCircles (already in store) so the color renders immediately.
      if (newList && listData.circleId && !newList.circle?.color) {
        const pickerCircles = getState().circles?.pickerCircles ?? [];
        const circle = pickerCircles.find(
          c => (c._id || c.id) === listData.circleId,
        );
        if (circle) newList.circle = circle;
      }

      return newList;
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
  async (_, {rejectWithValue}) => {
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
  async ({listId}, {rejectWithValue}) => {
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
  async ({listId, items}, {rejectWithValue, getState}) => {
    // Store previous list state for rollback
    const state = getState().lists;
    const previousList = state.listById[listId] || null;
    const previousLists = [...state.lists];

    try {
      const response = await axios.post(`/lists/add-item/${listId}`, {items});
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
  {condition: requireConnectivity},
);

// ============================================
// 5. MARK ITEM AS PURCHASED (Optimistic Update)
// PATCH /api/lists/purchase-item/{listId}/items/{itemId}
// ============================================
export const markItemAsPurchased = createAsyncThunk(
  "lists/markItemAsPurchased",
  async ({listId, itemId}, {rejectWithValue, getState}) => {
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
  {condition: requireConnectivity},
);

// ============================================
// 6. MARK ITEM AS UNPURCHASED (Optimistic Update)
// PUT /api/lists/unpurchase-item/{listId}/items/{itemId}
// ============================================
export const markItemAsUnpurchased = createAsyncThunk(
  "lists/markItemAsUnpurchased",
  async ({listId, itemId}, {rejectWithValue, getState}) => {
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
  {condition: requireConnectivity},
);

// ============================================
// 7. DELETE ITEM FROM LIST (Optimistic Update)
// DELETE /api/lists/delete-item/{listId}/items/{itemId}
// ============================================
export const deleteItemFromList = createAsyncThunk(
  "lists/deleteItemFromList",
  async ({listId, itemId}, {rejectWithValue, getState}) => {
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
  {condition: requireConnectivity},
);

// ============================================
// 8. DELETE LIST (Optimistic Update)
// DELETE /api/lists/delete-list/{listId}
// ============================================
export const deleteList = createAsyncThunk(
  "lists/deleteList",
  async ({listId}, {rejectWithValue, getState}) => {
    // Store previous lists for rollback
    const previousLists = [...getState().lists.lists];
    const previousListById = {...getState().lists.listById};

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
  {condition: requireConnectivity},
);

// ============================================
// 10. UPDATE ITEM PRIORITY (Optimistic Update)
// PATCH /api/lists/update-item-priority/{listId}/{itemId}
// ============================================
export const updateItemPriority = createAsyncThunk(
  "lists/updateItemPriority",
  async ({listId, itemId, priority}, {rejectWithValue, getState}) => {
    const previousList = getState().lists.listById[listId] || null;

    try {
      await axios.patch(`/lists/update-item-priority/${listId}/${itemId}`, {
        priority,
      });
      return {listId, itemId, priority};
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        previousList,
        listId,
      });
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// UPDATE ITEM NAME (Optimistic Update)
// PATCH /api/lists/update-item-name/{listId}/{itemId}
// ============================================
export const updateItemName = createAsyncThunk(
  "lists/updateItemName",
  async ({listId, itemId, name}, {rejectWithValue, getState}) => {
    const previousList = getState().lists.listById[listId] || null;
    try {
      await axios.patch(`/lists/update-item-name/${listId}/${itemId}`, {name});
      return {listId, itemId, name};
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        previousList,
        listId,
      });
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 9. FETCH ARCHIVED LISTS
// GET /api/lists/archived
// ============================================
export const fetchArchivedLists = createAsyncThunk(
  "lists/fetchArchivedLists",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/lists/archived");
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// 10. TOGGLE ARCHIVE LIST (Optimistic Update)
// PATCH /api/lists/toggle-archive/{listId}
// ============================================
export const toggleArchiveList = createAsyncThunk(
  "lists/toggleArchiveList",
  async ({listId}, {rejectWithValue, getState}) => {
    const previousLists = [...getState().lists.lists];
    const previousListById = {...getState().lists.listById};
    try {
      const response = await axios.patch(`/lists/toggle-archive/${listId}`);
      return {listId, data: response.data?.data || response.data};
    } catch (err) {
      return rejectWithValue({
        message: getErrorMessage(err),
        previousLists,
        previousListById,
      });
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 11. DUPLICATE LIST
// POST /api/lists/duplicate/{listId}
// ============================================
export const duplicateList = createAsyncThunk(
  "lists/duplicateList",
  async ({listId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(`/lists/duplicate/${listId}`);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 12. UPDATE LIST NAME (Optimistic Update)
// PATCH /api/lists/update-name/{listId}
// ============================================
export const updateListName = createAsyncThunk(
  "lists/updateListName",
  async ({listId, name}, {rejectWithValue, getState}) => {
    const previousLists = [...getState().lists.lists];
    const previousListById = {...getState().lists.listById};
    try {
      const response = await axios.patch(`/lists/update-name/${listId}`, {
        name,
      });
      console.log("response", response);
      return {listId, name, data: response.data?.data || response.data};
    } catch (err) {
      console.log("err", err);
      return rejectWithValue({
        message: getErrorMessage(err),
        previousLists,
        previousListById,
        listId,
      });
    }
  },
  {condition: requireConnectivity},
);

export const fetchRecentActivities = createAsyncThunk(
  "lists/fetchRecentActivities",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/activities/recent");
      console.log("response", response);
      // Handle nested data structure: response.data.data.data (array)
      const activities =
        response.data?.data?.data || response.data?.data || response.data;
      return Array.isArray(activities) ? activities : [];
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// GET COMMENTS
// GET /api/lists/get-comments/{listId}
// ============================================
export const getComments = createAsyncThunk(
  "lists/getComments",
  async ({listId}, {rejectWithValue}) => {
    try {
      const response = await axios.get(`/lists/get-comments/${listId}`);
      console.log("getComments response.data:", response.data);
      const comments = response.data?.data?.data || response.data?.data || [];
      return {
        listId,
        comments,
      };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// SHARE / UNSHARE LIST
// PATCH /api/lists/update-type/{listId}
// Body: { type: "shared" | "personal", circleId? }
// ============================================
export const shareListToCircle = createAsyncThunk(
  "lists/shareListToCircle",
  async ({listId, circleId, type = "shared"}, {rejectWithValue}) => {
    try {
      const body = {type};
      if (circleId) body.circleId = circleId;
      const response = await axios.patch(`/lists/update-type/${listId}`, body);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// ADD COMMENT
// POST /api/lists/add-comment/{listId}
// ============================================
export const addComment = createAsyncThunk(
  "lists/addComment",
  async ({listId, text}, {rejectWithValue}) => {
    try {
      const response = await axios.post(`/lists/add-comment/${listId}`, {text});
      return {
        listId,
        comment: response.data?.data || response.data,
      };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {condition: requireConnectivity},
);
