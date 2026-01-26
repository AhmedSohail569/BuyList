import {configureStore, combineReducers} from "@reduxjs/toolkit";
import {persistStore, persistReducer} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authReducer from "../reducers/authReducer";
import circleReducer from "../reducers/circleReducer";
import listReducer from "../reducers/listReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  circles: circleReducer,
  lists: listReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "circles", "lists"],
  // State reconciler to filter out unexpected keys during rehydration
  stateReconciler: (inboundState, originalState, reducedState) => {
    // Filter out any unexpected keys from inboundState
    const expectedKeys = ["auth", "circles", "lists"];
    const filteredInbound = {};
    
    if (inboundState && typeof inboundState === "object") {
      expectedKeys.forEach(key => {
        if (inboundState[key] !== undefined) {
          filteredInbound[key] = inboundState[key];
        }
      });
    }
    
    // Return merged state with only expected keys
    return {
      ...reducedState,
      ...filteredInbound,
    };
  },
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // ignore redux-persist warnings
    }),
});

export const persistor = persistStore(store);
