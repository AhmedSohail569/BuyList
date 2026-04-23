import { createAsyncThunk } from "@reduxjs/toolkit";
import { Platform } from "react-native";
import { getErrorMessage } from "~utils";
import axios from "~utils/axiosInstance";

/**
 * Fetch user profile
 */
export const getProfile = createAsyncThunk(
    "profile/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get("/auth/me");
            const data = response.data;
            const userData = data?.data?.user || data?.user || data || {};
            return {
                ...(typeof userData === "object" ? userData : {}),
                hasUnreadNotifications: data?.data?.hasUnreadNotifications || false,
            };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    },
);

/**
 * Upload profile picture
 * @param {Object} image - Image from picker { path, mime, filename }
 */
export const uploadProfilePicture = createAsyncThunk(
    "profile/uploadProfilePicture",
    async (image, { rejectWithValue }) => {
        try {
            const formData = new FormData();

            const file = {
                uri: Platform.OS === "ios" ? image.path.replace("file://", "") : image.path,
                type: image.mime || "image/jpeg",
                name: image.filename || `profile_${Date.now()}.jpg`,
            };

            formData.append("profilePicture", file);

            const response = await axios.post("/auth/upload-profile-picture", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 120000,
            });

            const data = response.data;
            return data?.data?.profilePicture || data?.profilePicture || data?.data?.user?.profilePicture;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    },
);

/**
 * Update user info — only sends modified fields
 * @param {Object} userInfo - Fields to update
 */
export const updateUserInfo = createAsyncThunk(
    "profile/updateUserInfo",
    async (userInfo, { rejectWithValue }) => {
        try {
            // Filter out empty/null/undefined values
            const filteredInfo = Object.entries(userInfo).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    acc[key] = value;
                }
                return acc;
            }, {});

            if (Object.keys(filteredInfo).length === 0) {
                return rejectWithValue("No changes to save");
            }

            const response = await axios.patch("/auth/update-user-info", filteredInfo);
            const data = response.data;
            return data?.data?.user || data?.user || data?.data || data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err));
        }
    },
);
