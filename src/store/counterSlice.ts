/**
 * @file counterSlice.ts
 * @description Redux slice for a simple counter (test/example).
 */
import { createSlice } from '@reduxjs/toolkit';

/**
 * Counter slice for demonstration and testing Redux setup.
 */
export const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

export const { increment } = counterSlice.actions;
export default counterSlice.reducer;
