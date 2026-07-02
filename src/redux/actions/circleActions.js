/**
 * Circle Management Async Thunks
 * Handles all circle-related API operations with optimistic updates
 */
import {createAsyncThunk} from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import {getErrorMessage} from "~utils";
import {requireConnectivity} from "~utils/network";

// ============================================
// 1️⃣ GET USER OWNED CIRCLE
// User can only have one owned circle
// ============================================
export const fetchownedCircles = createAsyncThunk(
  "circles/fetchownedCircles",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/circles/owned");
      console.log("response==>", response);
      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 2️⃣ GET ALL CIRCLES
// User-owned + circles user is a member of
// ============================================
export const fetchAllCircles = createAsyncThunk(
  "circles/fetchAllCircles",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/circles/my-circles");
      console.log("responseAllCircles==>", response);
      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 3️⃣ GET CIRCLE MEMBERS BY CIRCLE ID
// ============================================
export const fetchCircleMembers = createAsyncThunk(
  "circles/fetchCircleMembers",
  async ({circleId}, {rejectWithValue}) => {
    try {
      const response = await axios.get(`/circles/members/${circleId}`);
      return {
        circleId,
        members: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
);

// ============================================
// 4️⃣ REMOVE MEMBER FROM CIRCLE (Optimistic Update)
// DELETE /api/circles/{circleId}/members/{memberId}
// ============================================
export const removeMemberFromCircle = createAsyncThunk(
  "circles/removeMember",
  async ({circleId, memberId}, {rejectWithValue, getState}) => {
    // Store previous members for rollback
    const previousMembers =
      getState().circles.membersByCircleId[circleId] || [];

    try {
      const response = await axios.delete(
        `/circles/${circleId}/members/${memberId}`,
      );
      return {
        circleId,
        memberId,
        response: response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous members for rollback
      return rejectWithValue({message, previousMembers, circleId});
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 5. EDIT CIRCLE NAME (Optimistic Update)
// PUT /api/circles/edit-circle/{circleId}
// ============================================
export const editCircleName = createAsyncThunk(
  "circles/editCircleName",
  async ({circleId, name}, {rejectWithValue, getState}) => {
    // Store previous state for rollback
    const state = getState().circles;
    const previousownedCircles = Array.isArray(state.ownedCircles)
      ? [...state.ownedCircles]
      : state.ownedCircles;
    const previousAllCircles = [...state.allCircles];

    try {
      const response = await axios.put(`/circles/edit-circle/${circleId}`, {
        name,
      });

      return {
        circleId,
        name,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous state for rollback
      return rejectWithValue({
        message,
        previousownedCircles,
        previousAllCircles,
        circleId,
      });
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 6️⃣ ADD MEMBER TO CIRCLE (Optimistic Update)
// POST /api/circles/{circleId}/members
// ============================================
export const addMemberToCircle = createAsyncThunk(
  "circles/addMember",
  async (
    {circleId, userId, role = "member", tempMember},
    {rejectWithValue, getState},
  ) => {
    // Store previous members for rollback
    const previousMembers =
      getState().circles.membersByCircleId[circleId] || [];

    try {
      const response = await axios.post(`/circles/${circleId}/members`, {
        userId,
        role,
      });
      return {
        circleId,
        member: response.data?.data || response.data,
        tempMemberId: tempMember?.id,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous members for rollback
      return rejectWithValue({message, previousMembers, circleId});
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 7. UPDATE MEMBER ROLE (Optimistic Update)
// PUT /api/circles/members/{circleId}/{memberId}
// ============================================
export const updateMemberRole = createAsyncThunk(
  "circles/updateMemberRole",
  async ({circleId, memberId, role}, {rejectWithValue, getState}) => {
    // Store previous members for rollback
    const previousMembers =
      getState().circles.membersByCircleId[circleId] || [];

    try {
      const response = await axios.put(
        `/circles/members/${circleId}/${memberId}`,
        {role},
      );
      return {
        circleId,
        memberId,
        role,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      // Return previous members for rollback
      return rejectWithValue({message, previousMembers, circleId});
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 8. UPDATE DEFAULT ROLE FOR INVITED MEMBERS
// PUT /circles/default-role/{circleId}
// Body: { defaultMemberRole: "editor" | "viewer" }
// ============================================
export const updateCircleDefaultMemberRole = createAsyncThunk(
  "circles/updateCircleDefaultMemberRole",
  async ({circleId, defaultMemberRole}, {rejectWithValue}) => {
    try {
      const normalizedRole = String(defaultMemberRole || "").toLowerCase();
      if (!circleId) {
        return rejectWithValue("Circle not found");
      }
      if (normalizedRole !== "editor" && normalizedRole !== "viewer") {
        return rejectWithValue("Invalid default role");
      }

      const response = await axios.put(`/circles/default-role/${circleId}`, {
        defaultMemberRole: normalizedRole,
      });

      return {
        circleId,
        defaultMemberRole: normalizedRole,
        response: response.data?.data || response.data,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 9. SET CIRCLE AS DEFAULT
// PUT /circles/set-default/{circleId}
// ============================================
export const setDefaultCircle = createAsyncThunk(
  "circles/setDefaultCircle",
  async ({circleId}, {rejectWithValue}) => {
    try {
      if (!circleId) {
        return rejectWithValue("Circle not found");
      }

      await axios.put(`/circles/set-default/${circleId}`);

      return {circleId};
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 10. DELETE CIRCLE
// DELETE /circles/delete-circle/{circleId}
// ============================================
export const deleteCircle = createAsyncThunk(
  "circles/deleteCircle",
  async ({circleId}, {rejectWithValue}) => {
    try {
      if (!circleId) {
        return rejectWithValue("Circle not found");
      }

      await axios.delete(`/circles/delete-circle/${circleId}`);

      return {circleId};
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 11. CREATE CIRCLE
// POST /circles/create-circle
// Body: { name, color }
// ============================================
export const createCircle = createAsyncThunk(
  "circles/createCircle",
  async ({name, color}, {rejectWithValue}) => {
    try {
      if (!name) {
        return rejectWithValue("Circle name is required");
      }

      const response = await axios.post("/circles/create-circle", {
        name,
        color,
      });

      return response.data?.data || response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 8️⃣ GET CIRCLES FOR PICKER
// Lightweight list used in create-list modal
// ============================================
export const fetchCirclesPicker = createAsyncThunk(
  "circles/fetchCirclesPicker",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/circles/picker");
      console.log("response", response.data?.data || response.data);
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// 9️⃣ GET ALL CONNECTIONS
// All members across all circles user belongs to
// ============================================
export const fetchAllConnections = createAsyncThunk(
  "circles/fetchAllConnections",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/circles/all-connections");
      return response.data?.data || response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// 12. LEAVE CIRCLE
// POST /circles/leave/{circleId}
// ============================================
export const leaveCircle = createAsyncThunk(
  "circles/leaveCircle",
  async ({circleId}, {rejectWithValue}) => {
    try {
      if (!circleId) {
        return rejectWithValue("Circle not found");
      }

      await axios.post(`/circles/leave/${circleId}`);

      return {circleId};
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 14. FETCH CIRCLE JOIN REQUESTS (pending invitations to me)
// GET /circles/join-requests
// ============================================
export const fetchCircleRequests = createAsyncThunk(
  "circles/fetchCircleRequests",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/invitations/pending");
      return response.data?.data || response.data || [];
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

// ============================================
// 15. ACCEPT CIRCLE JOIN REQUEST
// POST /invitations/respond/{requestId}
// Body: { action: "accept" }
// ============================================
export const acceptCircleRequest = createAsyncThunk(
  "circles/acceptCircleRequest",
  async ({requestId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(
        `/invitations/respond/${requestId}`,
        {action: "accept"},
      );
      return {requestId, data: response.data?.data || response.data};
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 16. REJECT CIRCLE JOIN REQUEST
// POST /invitations/respond/{requestId}
// Body: { action: "reject" }
// ============================================
export const rejectCircleRequest = createAsyncThunk(
  "circles/rejectCircleRequest",
  async ({requestId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(
        `/invitations/respond/${requestId}`,
        {action: "reject"},
      );
      return {requestId, data: response.data?.data || response.data};
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
  {condition: requireConnectivity},
);

// ============================================
// 13. TOGGLE CIRCLE NOTIFICATIONS
// PATCH /notifications/toggle-circle-notifications/{circleId}
// ============================================
export const toggleCircleNotifications = createAsyncThunk(
  "circles/toggleCircleNotifications",
  async ({circleId}, {rejectWithValue}) => {
    try {
      if (!circleId) {
        return rejectWithValue("Circle not found");
      }

      const response = await axios.patch(
        `/notifications/toggle-circle-notifications/${circleId}`,
      );

      return {
        circleId,
        isNotificationMuted:
          response.data?.data?.isNotificationMuted ??
          response.data?.isNotificationMuted,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return rejectWithValue(message);
    }
  },
  {condition: requireConnectivity},
);
