import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getErrorMessage,
  getValidationErrors,
  storeAccessToken,
  storeRefreshToken,
  getDeviceInfo,
} from "~utils";
import axios from "~utils/axiosInstance";
import { getPendingInvite, clearPendingInvite } from "~utils/deepLinking";
import { joinCircleViaInvite } from "./inviteActions";
import Toast from "react-native-toast-message";

export const appleLogin = createAsyncThunk(
  "auth/appleLogin",
  async ({ token, fullName, email }, { rejectWithValue, dispatch }) => {
    try {
      const deviceInfo = await getDeviceInfo();

      // Exchange the Apple identityToken for backend session
      const response = await axios.post("/auth/apple", {
        token,
        givenName: fullName.givenName,
        familyName: fullName.familyName,
        email,
        deviceInfo,
      });

      const data = response.data;

      // Persist standard tokens
      await storeAccessToken(data?.data?.accessToken);
      await storeRefreshToken(data?.data?.refreshToken);

      // Handle deferred deep-link invite (joining pending circles on first login/signup)
      const pendingInvite = await getPendingInvite();
      if (pendingInvite) {
        setTimeout(async () => {
          try {
            await dispatch(joinCircleViaInvite({ inviteCode: pendingInvite })).unwrap();
            await clearPendingInvite();
            Toast.show({
              type: "success",
              text1: "Joined Circle!",
              text2: "You've been automatically added to the circle",
            });
          } catch {
            Toast.show({
              type: "error",
              text1: "Couldn't Join Circle",
              text2: "You can join manually from the invite link",
            });
          }
        }, 1000);
      }

      return data?.data || data;
    } catch (err) {
      console.log("err", err);
      console.log("getErrorMessage(err)", err.response);
      return rejectWithValue({
        message: getErrorMessage(err),
        fields: getValidationErrors(err),
      });
    }
  },
);
