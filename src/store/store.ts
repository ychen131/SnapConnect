/**
 * @file store.ts
 * @description Configures and exports the Redux store. Redux DevTools are enabled by default in development mode.
 * To customize, pass the 'devTools' option to configureStore.
 */
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import authReducer from './authSlice';
import realtimeReducer from './realtimeSlice';

/**
 * The main Redux store for the app.
 */
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    realtime: realtimeReducer,
  },
  // devTools: process.env.NODE_ENV !== 'production', // Uncomment to customize
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
