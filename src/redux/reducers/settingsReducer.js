/**
 * Settings Redux Slice
 * Manages user preferences like distance unit and language
 */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  distanceUnit: "Kilometers", // Default to Kilometers or Miles based on user preference
  language: "en",             // Default to English ('en' | 'nl')
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setDistanceUnit(state, action) {
      state.distanceUnit = action.payload;
    },
    setLanguage(state, action) {
      state.language = action.payload;
    },
  },
});

export const { setDistanceUnit, setLanguage } = settingsSlice.actions;

export default settingsSlice.reducer;
