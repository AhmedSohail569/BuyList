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

// ─────────────────────────────────────────────────────────────────────────────
// Combined slice reducer
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Root reducer — complete state wipe on logout
//
// Passing `undefined` to combinedReducer causes every slice to return its own
// initialState, giving us a guaranteed clean slate on every logout regardless
// of which code path triggered it.
// ─────────────────────────────────────────────────────────────────────────────
const rootReducer = (state, action) => {
  if (action.type === logout.type) {
    return combinedReducer(undefined, action);
  }
  return combinedReducer(state, action);
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistence — only slices that must survive an app restart are whitelisted.
// ─────────────────────────────────────────────────────────────────────────────
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "circles", "lists", "location", "profile", "theme"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // suppress redux-persist action type warnings
    }),
});

export const persistor = persistStore(store);

// ─────────────────────────────────────────────────────────────────────────────
// logoutAndPurge — server-gated logout.
//
// Flow:
//   1. POST /session/logout-current  (token still valid → axios attaches it)
//   2. Only on SUCCESS: dispatch(logout()) + persistor.purge()
//   3. On FAILURE: throws so the caller can show an error toast and abort.
//
// Call sites (settings/index.js) are responsible for showing loading state
// while this resolves and handling the error if it rejects.
// ─────────────────────────────────────────────────────────────────────────────
export const logoutAndPurge = async () => {
  const { logoutCurrentSession } = await import("../actions/sessionActions");

  // Step 1 — tell the server; this throws if the server returns an error
  const result = await store.dispatch(logoutCurrentSession());

  if (logoutCurrentSession.rejected.match(result)) {
    // Server rejected the logout — surface the error to the caller
    throw new Error(result.payload || "Failed to logout. Please try again.");
  }

  // Step 2 — server confirmed: wipe Redux state
  store.dispatch(logout());

  // Step 3 — wipe the persisted AsyncStorage snapshot
  persistor.purge();
};

// ─────────────────────────────────────────────────────────────────────────────
// forceLogoutAndPurge — bypass server; used by the 401 interceptor.
//
// When the token is already expired the server call would fail or be pointless,
// so we wipe state immediately without a server round-trip.
// ─────────────────────────────────────────────────────────────────────────────
export const forceLogoutAndPurge = () => {
  store.dispatch(logout());
  persistor.purge();
};
