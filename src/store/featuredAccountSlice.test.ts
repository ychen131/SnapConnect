/**
 * @file featuredAccountSlice.test.ts
 * @description Unit tests for featured accounts Redux slice.
 */
import featuredAccountSlice, {
  clearError,
  clearFeaturedAccounts,
  addFeaturedAccount,
  removeFeaturedAccount,
  updateAccountStoryCount,
  fetchFeaturedAccounts,
  fetchFeaturedAccountsWithStories,
  selectFeaturedAccounts,
  selectFeaturedAccountsLoading,
  selectFeaturedAccountsError,
  selectFeaturedAccountsWithStories,
  selectFeaturedAccountById,
  selectLastFetched,
  type FeaturedAccountState,
} from './featuredAccountSlice';
import {
  getFeaturedAccounts,
  getFeaturedAccountsWithActiveStories,
} from '../services/featuredAccountService';

// Mock the service functions
jest.mock('../services/featuredAccountService', () => ({
  getFeaturedAccounts: jest.fn(),
  getFeaturedAccountsWithActiveStories: jest.fn(),
}));

const mockGetFeaturedAccounts = getFeaturedAccounts as jest.MockedFunction<
  typeof getFeaturedAccounts
>;
const mockGetFeaturedAccountsWithActiveStories =
  getFeaturedAccountsWithActiveStories as jest.MockedFunction<
    typeof getFeaturedAccountsWithActiveStories
  >;

describe('featuredAccountSlice', () => {
  const mockFeaturedAccount: any = {
    user_id: 'user1',
    username: 'featured_user1',
    avatar_url: 'https://example.com/avatar1.jpg',
    bio: 'Featured user bio',
    is_featured: true,
    story_count: 3,
    latest_story_created_at: '2024-01-01T00:00:00Z',
  };

  const mockFeaturedAccount2: any = {
    user_id: 'user2',
    username: 'featured_user2',
    avatar_url: 'https://example.com/avatar2.jpg',
    bio: 'Featured user bio 2',
    is_featured: true,
    story_count: 0,
    latest_story_created_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    it('should handle initial state', () => {
      const initialState = featuredAccountSlice(undefined, { type: 'unknown' });
      expect(initialState).toEqual({
        accounts: [],
        isLoading: false,
        error: null,
        lastFetched: null,
      });
    });

    it('should handle clearError', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: false,
        error: 'Some error',
        lastFetched: null,
      };

      const newState = featuredAccountSlice(initialState, clearError());
      expect(newState.error).toBeNull();
    });

    it('should handle clearFeaturedAccounts', () => {
      const initialState: FeaturedAccountState = {
        accounts: [mockFeaturedAccount],
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      };

      const newState = featuredAccountSlice(initialState, clearFeaturedAccounts());
      expect(newState.accounts).toEqual([]);
      expect(newState.lastFetched).toBeNull();
    });

    it('should handle addFeaturedAccount - new account', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: false,
        error: null,
        lastFetched: null,
      };

      const newState = featuredAccountSlice(initialState, addFeaturedAccount(mockFeaturedAccount));
      expect(newState.accounts).toEqual([mockFeaturedAccount]);
    });

    it('should handle addFeaturedAccount - update existing account', () => {
      const initialState: FeaturedAccountState = {
        accounts: [mockFeaturedAccount],
        isLoading: false,
        error: null,
        lastFetched: null,
      };

      const updatedAccount = { ...mockFeaturedAccount, story_count: 5 };
      const newState = featuredAccountSlice(initialState, addFeaturedAccount(updatedAccount));
      expect(newState.accounts).toEqual([updatedAccount]);
      expect(newState.accounts).toHaveLength(1);
    });

    it('should handle removeFeaturedAccount', () => {
      const initialState: FeaturedAccountState = {
        accounts: [mockFeaturedAccount, mockFeaturedAccount2],
        isLoading: false,
        error: null,
        lastFetched: null,
      };

      const newState = featuredAccountSlice(initialState, removeFeaturedAccount('user1'));
      expect(newState.accounts).toEqual([mockFeaturedAccount2]);
      expect(newState.accounts).toHaveLength(1);
    });

    it('should handle updateAccountStoryCount', () => {
      const initialState: FeaturedAccountState = {
        accounts: [mockFeaturedAccount],
        isLoading: false,
        error: null,
        lastFetched: null,
      };

      const newState = featuredAccountSlice(
        initialState,
        updateAccountStoryCount({ userId: 'user1', storyCount: 7 }),
      );
      expect(newState.accounts[0].story_count).toBe(7);
    });

    it('should not update story count for non-existent account', () => {
      const initialState: FeaturedAccountState = {
        accounts: [mockFeaturedAccount],
        isLoading: false,
        error: null,
        lastFetched: null,
      };

      const newState = featuredAccountSlice(
        initialState,
        updateAccountStoryCount({ userId: 'nonexistent', storyCount: 7 }),
      );
      expect(newState.accounts[0].story_count).toBe(3); // Original value unchanged
    });
  });

  describe('async thunks', () => {
    it('should handle fetchFeaturedAccounts.pending', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: false,
        error: 'Previous error',
        lastFetched: null,
      };

      const pendingAction = fetchFeaturedAccounts.pending('', undefined);
      const newState = featuredAccountSlice(initialState, pendingAction);
      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('should handle fetchFeaturedAccounts.fulfilled', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: true,
        error: null,
        lastFetched: null,
      };

      const mockAccounts = [mockFeaturedAccount, mockFeaturedAccount2];
      const fulfilledAction = fetchFeaturedAccounts.fulfilled(mockAccounts, '', undefined);
      const newState = featuredAccountSlice(initialState, fulfilledAction);

      expect(newState.isLoading).toBe(false);
      expect(newState.accounts).toEqual(mockAccounts);
      expect(newState.error).toBeNull();
      expect(newState.lastFetched).toBeGreaterThan(0);
    });

    it('should handle fetchFeaturedAccounts.rejected', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: true,
        error: null,
        lastFetched: null,
      };

      const errorMessage = 'Failed to fetch';
      const rejectedAction = fetchFeaturedAccounts.rejected(
        new Error(errorMessage),
        '',
        undefined,
        errorMessage,
      );
      const newState = featuredAccountSlice(initialState, rejectedAction);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });

    it('should handle fetchFeaturedAccountsWithStories.pending', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: false,
        error: 'Previous error',
        lastFetched: null,
      };

      const pendingAction = fetchFeaturedAccountsWithStories.pending('', undefined);
      const newState = featuredAccountSlice(initialState, pendingAction);
      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    it('should handle fetchFeaturedAccountsWithStories.fulfilled', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: true,
        error: null,
        lastFetched: null,
      };

      const mockAccounts = [mockFeaturedAccount]; // Only account with stories
      const fulfilledAction = fetchFeaturedAccountsWithStories.fulfilled(
        mockAccounts,
        '',
        undefined,
      );
      const newState = featuredAccountSlice(initialState, fulfilledAction);

      expect(newState.isLoading).toBe(false);
      expect(newState.accounts).toEqual(mockAccounts);
      expect(newState.error).toBeNull();
      expect(newState.lastFetched).toBeGreaterThan(0);
    });

    it('should handle fetchFeaturedAccountsWithStories.rejected', () => {
      const initialState: FeaturedAccountState = {
        accounts: [],
        isLoading: true,
        error: null,
        lastFetched: null,
      };

      const errorMessage = 'Failed to fetch with stories';
      const rejectedAction = fetchFeaturedAccountsWithStories.rejected(
        new Error(errorMessage),
        '',
        undefined,
        errorMessage,
      );
      const newState = featuredAccountSlice(initialState, rejectedAction);

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('selectors', () => {
    const mockState = {
      featuredAccounts: {
        accounts: [mockFeaturedAccount, mockFeaturedAccount2],
        isLoading: false,
        error: null,
        lastFetched: 1234567890,
      } as FeaturedAccountState,
    };

    it('should select featured accounts', () => {
      const result = selectFeaturedAccounts(mockState);
      expect(result).toEqual([mockFeaturedAccount, mockFeaturedAccount2]);
    });

    it('should select loading state', () => {
      const result = selectFeaturedAccountsLoading(mockState);
      expect(result).toBe(false);
    });

    it('should select error state', () => {
      const result = selectFeaturedAccountsError(mockState);
      expect(result).toBeNull();
    });

    it('should select featured accounts with stories', () => {
      const result = selectFeaturedAccountsWithStories(mockState);
      expect(result).toEqual([mockFeaturedAccount]); // Only account with story_count > 0
    });

    it('should select featured account by ID', () => {
      const result = selectFeaturedAccountById(mockState, 'user1');
      expect(result).toEqual(mockFeaturedAccount);
    });

    it('should return undefined for non-existent account ID', () => {
      const result = selectFeaturedAccountById(mockState, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should select last fetched timestamp', () => {
      const result = selectLastFetched(mockState);
      expect(result).toBe(1234567890);
    });
  });

  describe('async thunk integration', () => {
    it('should dispatch fetchFeaturedAccounts successfully', async () => {
      const mockAccounts = [mockFeaturedAccount];
      mockGetFeaturedAccounts.mockResolvedValue(mockAccounts);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchFeaturedAccounts()(dispatch, getState, undefined);
      expect(result.payload).toEqual(mockAccounts);
      expect(mockGetFeaturedAccounts).toHaveBeenCalled();
    });

    it('should handle fetchFeaturedAccounts error', async () => {
      const error = new Error('Network error');
      mockGetFeaturedAccounts.mockRejectedValue(error);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchFeaturedAccounts()(dispatch, getState, undefined);
      expect(result.payload).toBe('Network error');
    });

    it('should dispatch fetchFeaturedAccountsWithStories successfully', async () => {
      const mockAccounts = [mockFeaturedAccount];
      mockGetFeaturedAccountsWithActiveStories.mockResolvedValue(mockAccounts);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchFeaturedAccountsWithStories()(dispatch, getState, undefined);
      expect(result.payload).toEqual(mockAccounts);
      expect(mockGetFeaturedAccountsWithActiveStories).toHaveBeenCalled();
    });

    it('should handle fetchFeaturedAccountsWithStories error', async () => {
      const error = new Error('Service error');
      mockGetFeaturedAccountsWithActiveStories.mockRejectedValue(error);

      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await fetchFeaturedAccountsWithStories()(dispatch, getState, undefined);
      expect(result.payload).toBe('Service error');
    });
  });
});
