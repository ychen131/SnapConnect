/**
 * @file featuredAccountSlice.ts
 * @description Redux slice for managing featured accounts state and async operations.
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getFeaturedAccounts,
  getFeaturedAccountsWithActiveStories,
  type FeaturedAccount,
} from '../services/featuredAccountService';

// State interface
export interface FeaturedAccountState {
  accounts: FeaturedAccount[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: FeaturedAccountState = {
  accounts: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchFeaturedAccounts = createAsyncThunk(
  'featuredAccounts/fetchFeaturedAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const accounts = await getFeaturedAccounts();
      return accounts;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch featured accounts',
      );
    }
  },
);

export const fetchFeaturedAccountsWithStories = createAsyncThunk(
  'featuredAccounts/fetchFeaturedAccountsWithStories',
  async (_, { rejectWithValue }) => {
    try {
      const accounts = await getFeaturedAccountsWithActiveStories();
      return accounts;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch featured accounts with stories',
      );
    }
  },
);

// Slice
const featuredAccountSlice = createSlice({
  name: 'featuredAccounts',
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Clear all featured accounts data
    clearFeaturedAccounts: (state) => {
      state.accounts = [];
      state.lastFetched = null;
    },

    // Add a single featured account (useful for real-time updates)
    addFeaturedAccount: (state, action: PayloadAction<FeaturedAccount>) => {
      const existingIndex = state.accounts.findIndex(
        (account) => account.user_id === action.payload.user_id,
      );
      if (existingIndex >= 0) {
        state.accounts[existingIndex] = action.payload;
      } else {
        state.accounts.push(action.payload);
      }
    },

    // Remove a featured account
    removeFeaturedAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter((account) => account.user_id !== action.payload);
    },

    // Update a featured account's story count
    updateAccountStoryCount: (
      state,
      action: PayloadAction<{ userId: string; storyCount: number }>,
    ) => {
      const account = state.accounts.find((acc) => acc.user_id === action.payload.userId);
      if (account) {
        account.story_count = action.payload.storyCount;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchFeaturedAccounts
    builder
      .addCase(fetchFeaturedAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchFeaturedAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch featured accounts';
      })

      // fetchFeaturedAccountsWithStories
      .addCase(fetchFeaturedAccountsWithStories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedAccountsWithStories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchFeaturedAccountsWithStories.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || 'Failed to fetch featured accounts with stories';
      });
  },
});

// Export actions
export const {
  clearError,
  clearFeaturedAccounts,
  addFeaturedAccount,
  removeFeaturedAccount,
  updateAccountStoryCount,
} = featuredAccountSlice.actions;

// Export selectors
export const selectFeaturedAccounts = (state: { featuredAccounts: FeaturedAccountState }) =>
  state.featuredAccounts.accounts;

export const selectFeaturedAccountsLoading = (state: { featuredAccounts: FeaturedAccountState }) =>
  state.featuredAccounts.isLoading;

export const selectFeaturedAccountsError = (state: { featuredAccounts: FeaturedAccountState }) =>
  state.featuredAccounts.error;

export const selectFeaturedAccountsWithStories = (state: {
  featuredAccounts: FeaturedAccountState;
}) => state.featuredAccounts.accounts.filter((account) => account.story_count > 0);

export const selectFeaturedAccountById = (
  state: { featuredAccounts: FeaturedAccountState },
  userId: string,
) => state.featuredAccounts.accounts.find((account) => account.user_id === userId);

export const selectLastFetched = (state: { featuredAccounts: FeaturedAccountState }) =>
  state.featuredAccounts.lastFetched;

// Export reducer
export default featuredAccountSlice.reducer;
