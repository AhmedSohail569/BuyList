/**
 * Circle Management Slice
 * Handles circle state with optimistic updates and rollback logic
 */
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOwnedCircle,
  fetchAllCircles,
  fetchCircleMembers,
  removeMemberFromCircle,
  editCircleName,
  addMemberToCircle,
  updateMemberRole,
  updateCircleDefaultMemberRole,
} from "../actions/circleActions";
import { logout } from "./authReducer";

// ============================================
// INITIAL STATE
// ============================================
const initialState = {
  // User's owned circle (can only have one)
  ownedCircle: null,

  // All circles: owned + circles user is member of
  allCircles: [],

  // Normalized members by circle ID for efficient lookup
  membersByCircleId: {},

  // Loading states for different operations
  loading: false,
  membersLoading: false,

  // Error state
  error: null,

  // Track which circles have loaded members (avoid refetching)
  loadedMemberCircleIds: [],
};

// ============================================
// SLICE DEFINITION
// ============================================
const circleSlice = createSlice({
  name: "circles",
  initialState,
  reducers: {
    // Clear all circle state (e.g., on logout)
    clearCircleState(state) {
      return initialState;
    },

    // Clear error state
    clearCircleError(state) {
      state.error = null;
    },

    // Manually set owned circle (if needed)
    setOwnedCircle(state, action) {
      state.ownedCircle = action.payload;
    },

    // Invalidate loaded members for a specific circle (force refetch)
    invalidateCircleMembers(state, action) {
      const circleId = action.payload;
      state.loadedMemberCircleIds = state.loadedMemberCircleIds.filter(
        id => id !== circleId,
      );
    },
  },

  extraReducers: builder => {
    builder
      // ============================================
      // 1️⃣ FETCH OWNED CIRCLE
      // ============================================
      .addCase(fetchOwnedCircle.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnedCircle.fulfilled, (state, action) => {
        state.loading = false;
        state.ownedCircle = action.payload;
      })
      .addCase(fetchOwnedCircle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 2️⃣ FETCH ALL CIRCLES
      // ============================================
      .addCase(fetchAllCircles.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCircles.fulfilled, (state, action) => {
        state.loading = false;
        state.allCircles = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllCircles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============================================
      // 3️⃣ FETCH CIRCLE MEMBERS
      // ============================================
      .addCase(fetchCircleMembers.pending, state => {
        state.membersLoading = true;
        state.error = null;
      })
      .addCase(fetchCircleMembers.fulfilled, (state, action) => {
        const { circleId, members } = action.payload;
        state.membersLoading = false;
        state.membersByCircleId[circleId] = Array.isArray(members) ? members : [];
        // Track that we've loaded members for this circle
        if (!state.loadedMemberCircleIds.includes(circleId)) {
          state.loadedMemberCircleIds.push(circleId);
        }
      })
      .addCase(fetchCircleMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.error = action.payload;
      })

      // ============================================
      // 4️⃣ REMOVE MEMBER FROM CIRCLE (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Remove member immediately on pending
      .addCase(removeMemberFromCircle.pending, (state, action) => {
        const { circleId, memberId } = action.meta.arg;
        const currentMembers = state.membersByCircleId[circleId] || [];
        // Optimistically remove the member
        state.membersByCircleId[circleId] = currentMembers.filter(
          member => member.id !== memberId && member._id !== memberId,
        );
      })
      .addCase(removeMemberFromCircle.fulfilled, (state, action) => {
        // Member already removed optimistically, nothing to do
        state.error = null;
      })
      // ROLLBACK: Restore previous members on failure
      .addCase(removeMemberFromCircle.rejected, (state, action) => {
        const { previousMembers, circleId, message } = action.payload || {};
        if (circleId && previousMembers) {
          // Rollback to previous state
          state.membersByCircleId[circleId] = previousMembers;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 5️⃣ EDIT CIRCLE NAME (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Update name immediately on pending
      .addCase(editCircleName.pending, (state, action) => {
        const { circleId, name } = action.meta.arg;

        // Update in ownedCircle if it matches
        if (state.ownedCircle && (state.ownedCircle.id === circleId || state.ownedCircle._id === circleId)) {
          state.ownedCircle = { ...state.ownedCircle, name };
        }

        // Update in allCircles array
        state.allCircles = state.allCircles.map(circle =>
          circle.id === circleId || circle._id === circleId
            ? { ...circle, name }
            : circle,
        );
      })
      .addCase(editCircleName.fulfilled, (state, action) => {
        // Name already updated optimistically
        // Only update name and updatedAt from response, preserve all other data
        const { circleId, response } = action.payload;
        if (response) {
          // Extract only name and updatedAt from response
          const updates = {};
          if (response.name !== undefined) {
            updates.name = response.name;
          }
          if (response.updatedAt !== undefined) {
            updates.updatedAt = response.updatedAt;
          }

          // Only update if we have something to update
          if (Object.keys(updates).length > 0) {
            if (state.ownedCircle && (state.ownedCircle.id === circleId || state.ownedCircle._id === circleId)) {
              state.ownedCircle = { ...state.ownedCircle, ...updates };
            }
            state.allCircles = state.allCircles.map(circle =>
              circle.id === circleId || circle._id === circleId
                ? { ...circle, ...updates }
                : circle,
            );
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous circle data on failure
      .addCase(editCircleName.rejected, (state, action) => {
        const { previousOwnedCircle, previousAllCircles, message } =
          action.payload || {};
        if (previousOwnedCircle !== undefined) {
          state.ownedCircle = previousOwnedCircle;
        }
        if (previousAllCircles) {
          state.allCircles = previousAllCircles;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 6️⃣ ADD MEMBER TO CIRCLE (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Add temporary member immediately on pending
      .addCase(addMemberToCircle.pending, (state, action) => {
        const { circleId, tempMember } = action.meta.arg;
        if (tempMember) {
          const currentMembers = state.membersByCircleId[circleId] || [];
          // Add temporary member with a temp flag
          state.membersByCircleId[circleId] = [
            ...currentMembers,
            { ...tempMember, _isOptimistic: true },
          ];
        }
      })
      .addCase(addMemberToCircle.fulfilled, (state, action) => {
        const { circleId, member, tempMemberId } = action.payload;
        const currentMembers = state.membersByCircleId[circleId] || [];

        if (tempMemberId) {
          // Replace temporary member with real member from API
          state.membersByCircleId[circleId] = currentMembers.map(m =>
            m.id === tempMemberId || m._id === tempMemberId ? member : m,
          );
        } else {
          // If no temp member, just add the new member (avoid duplicates)
          const memberExists = currentMembers.some(
            m => m.id === member.id || m._id === member._id,
          );
          if (!memberExists) {
            state.membersByCircleId[circleId] = [...currentMembers, member];
          }
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous members on failure
      .addCase(addMemberToCircle.rejected, (state, action) => {
        const { previousMembers, circleId, message } = action.payload || {};
        if (circleId && previousMembers) {
          // Rollback to previous state
          state.membersByCircleId[circleId] = previousMembers;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 7️⃣ UPDATE MEMBER ROLE (Optimistic Update)
      // ============================================
      // OPTIMISTIC: Update role immediately on pending
      .addCase(updateMemberRole.pending, (state, action) => {
        const { circleId, memberId, role } = action.meta.arg;
        const currentMembers = state.membersByCircleId[circleId] || [];
        // Optimistically update the member's role
        state.membersByCircleId[circleId] = currentMembers.map(member =>
          member.id === memberId || member._id === memberId
            ? { ...member, role }
            : member,
        );
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        // Role already updated optimistically
        // Optionally merge with server response
        const { circleId, memberId, response } = action.payload;
        if (response) {
          const currentMembers = state.membersByCircleId[circleId] || [];
          state.membersByCircleId[circleId] = currentMembers.map(member =>
            member.id === memberId || member._id === memberId
              ? { ...member, ...response }
              : member,
          );
        }
        state.error = null;
      })
      // ROLLBACK: Restore previous members on failure
      .addCase(updateMemberRole.rejected, (state, action) => {
        const { previousMembers, circleId, message } = action.payload || {};
        if (circleId && previousMembers) {
          // Rollback to previous state
          state.membersByCircleId[circleId] = previousMembers;
        }
        state.error = message || action.payload;
      })

      // ============================================
      // 8️⃣ UPDATE DEFAULT ROLE FOR INVITED MEMBERS
      // ============================================
      .addCase(updateCircleDefaultMemberRole.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        const { circleId, defaultMemberRole } = action.meta.arg || {};
        if (!circleId) return;

        // Optimistically update in ownedCircle if it matches
        if (
          state.ownedCircle &&
          (state.ownedCircle.id === circleId || state.ownedCircle._id === circleId)
        ) {
          state.ownedCircle = { ...state.ownedCircle, defaultMemberRole };
        }

        // Optimistically update in allCircles array
        state.allCircles = state.allCircles.map(circle =>
          circle.id === circleId || circle._id === circleId
            ? { ...circle, defaultMemberRole }
            : circle,
        );
      })
      .addCase(updateCircleDefaultMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const { circleId, defaultMemberRole, response } = action.payload || {};
        if (!circleId) return;

        const updates = {};
        if (defaultMemberRole !== undefined) updates.defaultMemberRole = defaultMemberRole;
        if (response?.updatedAt !== undefined) updates.updatedAt = response.updatedAt;

        if (Object.keys(updates).length === 0) return;

        if (
          state.ownedCircle &&
          (state.ownedCircle.id === circleId || state.ownedCircle._id === circleId)
        ) {
          state.ownedCircle = { ...state.ownedCircle, ...updates };
        }

        state.allCircles = state.allCircles.map(circle =>
          circle.id === circleId || circle._id === circleId
            ? { ...circle, ...updates }
            : circle,
        );
      })
      .addCase(updateCircleDefaultMemberRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear circle state on logout
      .addCase(logout, () => {
        return initialState;
      });
  },
});

// ============================================
// EXPORTED ACTIONS & REDUCER
// ============================================
export const {
  clearCircleState,
  clearCircleError,
  setOwnedCircle,
  invalidateCircleMembers,
} = circleSlice.actions;

export default circleSlice.reducer;
