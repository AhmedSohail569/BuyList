/**
 * Settings Redux Slice
 * Manages user preferences like distance unit (Kilometers vs Miles)
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  distanceUnit: "Kilometers", // Default to Kilometers or Miles based on user preference
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setDistanceUnit(state, action) {
      state.distanceUnit = action.payload;
    },
  },
});

export const { setDistanceUnit } = settingsSlice.actions;

export default settingsSlice.reducer;
