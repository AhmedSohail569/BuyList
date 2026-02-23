import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer, { logout } from "../reducers/authReducer";
import circleReducer from "../reducers/circleReducer";
import listReducer from "../reducers/listReducer";
import locationReducer from "../reducers/locationReducer";
import notificationReducer from "../reducers/notificationReducer";
import profileReducer from "../reducers/profileReducer";
import searchReducer from "../reducers/searchReducer";
import sessionReducer from "../reducers/sessionReducer";
import themeReducer from "../reducers/themeReducer";

// ─── Combined slice reducer ────────────────────────────────────────────────────
const combinedReducer = combineReducers({
  auth: authReducer,
  circles: circleReducer,
  lists: listReducer,
  location: locationReducer,
  notifications: notificationReducer,
  profile: profileReducer,
  search: searchReducer,
  session: sessionReducer,
  theme: themeReducer,
});

// ─── Root reducer — full state reset on logout ─────────────────────────────────
// Passing `undefined` causes every slice to return its initialState.
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    return combinedReducer(undefined, action);
  }
  return combinedReducer(state, action);
};

// ─── Persistence config ────────────────────────────────────────────────────────
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "circles", "lists", "location", "profile", "theme"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

// ─── logoutAndPurge ────────────────────────────────────────────────────────────
// Server-gated logout for current device.
// 1. POST /session/logout-current
// 2. On success → dispatch(logout()) + persistor.purge()
// 3. On failure → throws so the caller can show an error toast.
export const logoutAndPurge = async () => {
  const { logoutCurrentSession } = await import("../actions/sessionActions");

  const result = await store.dispatch(logoutCurrentSession());

  if (logoutCurrentSession.rejected.match(result)) {
    throw new Error(result.payload || "Failed to logout. Please try again.");
  }

  store.dispatch(logout());
  persistor.purge();
};

// ─── logoutAllAndPurge ─────────────────────────────────────────────────────────
// Logout from ALL devices (including current).
// 1. DELETE /session/logout-all  (invalidates every session server-side)
// 2. On success → dispatch(logout()) + persistor.purge()
//    This ensures the current device is logged out gracefully.
// 3. On failure → throws so the caller can handle the error.
export const logoutAllAndPurge = async () => {
  const { logoutAllSessions } = await import("../actions/sessionActions");

  const result = await store.dispatch(logoutAllSessions());

  if (logoutAllSessions.rejected.match(result)) {
    throw new Error(result.payload || "Failed to logout from all devices.");
  }

  // Wipe local state after server confirms all sessions ended
  store.dispatch(logout());
  persistor.purge();
};

// ─── forceLogoutAndPurge ───────────────────────────────────────────────────────
// Bypass server — used by the 401 interceptor when the token is already expired.
export const forceLogoutAndPurge = () => {
  store.dispatch(logout());
  persistor.purge();
};
