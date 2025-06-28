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
    bio?: string;
    avatar_url?: string;
    [key: string]: any;
  } | null;
  isLoading: boolean;
  error: string | null;
  permissionsRequested: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  permissionsRequested: false,
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
        bio?: string;
        avatar_url?: string;
        [key: string]: any;
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
    setPermissionsRequested(state, action: PayloadAction<boolean>) {
      state.permissionsRequested = action.payload;
    },
    logout(state) {
      state.user = null;
      state.error = null;
      state.isLoading = false;
      state.permissionsRequested = false;
    },
  },
});

export const { setUser, setLoading, setError, setPermissionsRequested, logout } = authSlice.actions;
export default authSlice.reducer;
