/**
 * @file authSlice.ts
 * @description Redux slice for authentication and user state management.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The shape of the authentication state.
 */
export interface AuthState {
  user: {
    id: string;
    email: string;
    username?: string;
    dateOfBirth?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

/**
 * Authentication slice for managing user state.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{
        id: string;
        email: string;
        username?: string;
        dateOfBirth?: string;
      } | null>,
    ) {
      state.user = action.payload;
      state.error = null;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      state.isLoading = false;
    },
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
