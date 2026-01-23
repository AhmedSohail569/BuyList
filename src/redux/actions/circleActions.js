/**
 * Circle Management Async Thunks
 * Handles all circle-related API operations with optimistic updates
 */
import {createAsyncThunk} from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import {getErrorMessage} from "~utils";

// ============================================
// 1️⃣ GET USER OWNED CIRCLE
// User can only have one owned circle
// ============================================
export const fetchOwnedCircle = createAsyncThunk(
  "circles/fetchOwnedCircle",
  async (_, {rejectWithValue}) => {
    try {
      const response = await axios.get("/circles/owned");
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
    const previousMembers = getState().circles.membersByCircleId[circleId] || [];

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
);

// ============================================
// 5️⃣ EDIT CIRCLE NAME (Optimistic Update)
// PUT /api/circles/edit-circle/{circleId}
// ============================================
export const editCircleName = createAsyncThunk(
  "circles/editCircleName",
  async ({circleId, name}, {rejectWithValue, getState}) => {
    // Store previous state for rollback
    const state = getState().circles;
    const previousOwnedCircle = state.ownedCircle;
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
        previousOwnedCircle,
        previousAllCircles,
        circleId,
      });
    }
  },
);

// ============================================
// 6️⃣ ADD MEMBER TO CIRCLE (Optimistic Update)
// POST /api/circles/{circleId}/members
// ============================================
export const addMemberToCircle = createAsyncThunk(
  "circles/addMember",
  async ({circleId, userId, role = "member", tempMember}, {rejectWithValue, getState}) => {
    // Store previous members for rollback
    const previousMembers = getState().circles.membersByCircleId[circleId] || [];

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
);

// ============================================
// 7️⃣ UPDATE MEMBER ROLE (Optimistic Update)
// PUT /api/circles/members/{circleId}/{memberId}
// ============================================
export const updateMemberRole = createAsyncThunk(
  "circles/updateMemberRole",
  async ({circleId, memberId, role}, {rejectWithValue, getState}) => {
    // Store previous members for rollback
    const previousMembers = getState().circles.membersByCircleId[circleId] || [];

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
);
