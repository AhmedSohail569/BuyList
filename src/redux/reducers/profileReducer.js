import { createSlice } from "@reduxjs/toolkit";
import {
    getProfile,
    uploadProfilePicture,
    updateUserInfo,
} from "../actions/profileActions";
import { logout } from "./authReducer";

const initialState = {
    profile: null,
    loading: false,
    error: null,
    // Upload states
    uploadingPicture: false,
    uploadPictureError: null,
    // Update info states
    updatingInfo: false,
    updateInfoError: null,
};

const profileSlice = createSlice({
    name: "profile",
    initialState,
    reducers: {
        clearProfile(state) {
            state.profile = null;
            state.error = null;
        },
        clearProfileError(state) {
            state.error = null;
            state.uploadPictureError = null;
            state.updateInfoError = null;
        },
        clearUploadPictureError(state) {
            state.uploadPictureError = null;
        },
        clearUpdateInfoError(state) {
            state.updateInfoError = null;
        },
        // Optimistic update for profile picture (for immediate UI feedback)
        setProfilePictureOptimistic(state, action) {
            if (state.profile) {
                state.profile.profilePicture = action.payload;
            }
        },
    },
    extraReducers: builder => {
        builder
            // getProfile
            .addCase(getProfile.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // uploadProfilePicture
            .addCase(uploadProfilePicture.pending, state => {
                state.uploadingPicture = true;
                state.uploadPictureError = null;
            })
            .addCase(uploadProfilePicture.fulfilled, (state, action) => {
                state.uploadingPicture = false;
                // Update profile picture in profile state
                if (state.profile && action.payload) {
                    state.profile.profilePicture = action.payload;
                }
            })
            .addCase(uploadProfilePicture.rejected, (state, action) => {
                state.uploadingPicture = false;
                state.uploadPictureError = action.payload;
            })

            // updateUserInfo
            .addCase(updateUserInfo.pending, state => {
                state.updatingInfo = true;
                state.updateInfoError = null;
            })
            .addCase(updateUserInfo.fulfilled, (state, action) => {
                state.updatingInfo = false;
                // Merge updated fields into profile
                if (state.profile && action.payload) {
                    state.profile = { ...state.profile, ...action.payload };
                }
            })
            .addCase(updateUserInfo.rejected, (state, action) => {
                state.updatingInfo = false;
                state.updateInfoError = action.payload;
            })

            // Clear profile on logout
            .addCase(logout, state => {
                state.profile = null;
                state.error = null;
                state.loading = false;
                state.uploadingPicture = false;
                state.uploadPictureError = null;
                state.updatingInfo = false;
                state.updateInfoError = null;
            });
    },
});

export const {
    clearProfile,
    clearProfileError,
    clearUploadPictureError,
    clearUpdateInfoError,
    setProfilePictureOptimistic,
} = profileSlice.actions;

export default profileSlice.reducer;
