/**
 * Circle Invite Actions
 * Redux async thunks for invite link generation and joining circles
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "~utils/axiosInstance";
import { getErrorMessage } from "~utils";

/**
 * Get invite link for a circle
 * GET /circles/invite-link/{circleId}
 * Returns: { inviteCode: string, inviteLink: string }
 */
export const getCircleInviteLink = createAsyncThunk(
    "invite/getInviteLink",
    async ({ circleId }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/circles/invite-link/${circleId}`);
            const data = response.data?.data || response.data;

            return {
                circleId,
                inviteCode: data.inviteCode || data.code,
                inviteLink: data.inviteLink || data.link,
            };
        } catch (err) {
            const message = getErrorMessage(err);
            return rejectWithValue(message);
        }
    },
);

/**
 * Get invite QR code for a circle
 * GET /circles/invite-qr/{circleId}
 * Returns: { qrCode: string (base64 or URL) }
 */
export const getCircleInviteQR = createAsyncThunk(
    "invite/getInviteQR",
    async ({ circleId }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/circles/invite-qr/${circleId}`);
            console.log('response', response)
            const data = response.data?.data || response.data;

            return {
                circleId,
                qrCode: data.qrCode || data.qrCodeUrl || data.qrUrl,
            };
        } catch (err) {
            console.log('err', err)
            console.log('err', err.response)
            const message = getErrorMessage(err);
            return rejectWithValue(message);
        }
    },
);

/**
 * Join a circle via invite code
 * POST /circles/join/{code}
 * Returns: Circle object with membership details
 */
export const joinCircleViaInvite = createAsyncThunk(
    "invite/joinCircle",
    async ({ inviteCode }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`/circles/join/${inviteCode}`);
            const data = response.data?.data || response.data;

            return {
                circle: data.circle || data,
                inviteCode,
            };
        } catch (err) {
            const message = getErrorMessage(err);
            return rejectWithValue(message);
        }
    },
);
