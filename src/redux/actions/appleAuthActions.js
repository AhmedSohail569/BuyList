import {createAsyncThunk} from "@reduxjs/toolkit";
import {
  getErrorMessage,
  getValidationErrors,
  storeAccessToken,
  storeRefreshToken,
  getDeviceInfo,
} from "~utils";
import axios from "~utils/axiosInstance";
import {getPendingInvite, clearPendingInvite} from "~utils/deepLinking";
import {createInvite} from "./inviteActions";
import Toast from "react-native-toast-message";

export const appleLogin = createAsyncThunk(
  "auth/appleLogin",
  async ({token, fullName, email}, {rejectWithValue, dispatch}) => {
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
            await dispatch(
              createInvite({inviteCode: pendingInvite}),
            ).unwrap();
            await clearPendingInvite();
          } catch (error) {
            console.log("error joining circle", error);
            Toast.show({
              type: "error",
              text1: "Couldn't Join Circle",
              text2:
                error?.message ||
                error ||
                "Already a member or circle doesn't exist",
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
