/**
 * @file store.ts
 * @description Configures and exports the Redux store.
 */
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

/**
 * The main Redux store for the app.
 */
export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
