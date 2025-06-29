/**
 * @file featuredAccountService.test.ts
 * @description Unit tests for featured account service functions.
 */
import { supabase } from './supabase';
import {
  getFeaturedAccounts,
  getFeaturedAccountsSimple,
  getFeaturedAccountById,
  getFeaturedAccountsWithActiveStories,
  isUserFeatured,
  updateFeaturedStatus,
  type FeaturedAccount,
} from './featuredAccountService';

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('featuredAccountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeaturedAccounts', () => {
    it('should return featured accounts when successful', async () => {
      const mockData: FeaturedAccount[] = [
        {
          user_id: 'user1',
          username: 'featured_user1',
          avatar_url: 'https://example.com/avatar1.jpg',
          bio: 'Featured user bio',
          is_featured: true,
          story_count: 3,
          latest_story_created_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await getFeaturedAccounts();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_featured_accounts_with_stories');
      expect(result).toEqual(mockData);
    });

    it('should throw error when Supabase call fails', async () => {
      const mockError = { message: 'Database error' };
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(getFeaturedAccounts()).rejects.toThrow();
    });

    it('should return empty array when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const result = await getFeaturedAccounts();

      expect(result).toEqual([]);
    });
  });

  describe('getFeaturedAccountsSimple', () => {
    it('should return featured accounts using view', async () => {
      const mockData: FeaturedAccount[] = [
        {
          user_id: 'user1',
          username: 'featured_user1',
          avatar_url: 'https://example.com/avatar1.jpg',
          bio: 'Featured user bio',
          is_featured: true,
          story_count: 2,
          latest_story_created_at: null,
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getFeaturedAccountsSimple();

      expect(mockSupabase.from).toHaveBeenCalledWith('featured_accounts_view');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockData);
    });

    it('should throw error when view query fails', async () => {
      const mockError = { message: 'View error' };
      const mockSelect = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(getFeaturedAccountsSimple()).rejects.toThrow();
    });
  });

  describe('getFeaturedAccountById', () => {
    it('should return featured account when found', async () => {
      const mockProfileData = {
        id: 'user1',
        username: 'featured_user1',
        avatar_url: 'https://example.com/avatar1.jpg',
        bio: 'Featured user bio',
        is_featured: true,
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfileData,
              error: null,
            }),
          }),
        }),
      });

      const mockCountSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              count: 3,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce({
          select: mockSelect,
        } as any)
        .mockReturnValueOnce({
          select: mockCountSelect,
        } as any);

      const result = await getFeaturedAccountById('user1');

      expect(result).toEqual({
        user_id: 'user1',
        username: 'featured_user1',
        avatar_url: 'https://example.com/avatar1.jpg',
        bio: 'Featured user bio',
        is_featured: true,
        story_count: 3,
        latest_story_created_at: null,
      });
    });

    it('should return null when user not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getFeaturedAccountById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error when query fails', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(getFeaturedAccountById('user1')).rejects.toThrow();
    });
  });

  describe('getFeaturedAccountsWithActiveStories', () => {
    it('should return only featured accounts with active stories', async () => {
      const mockData: FeaturedAccount[] = [
        {
          user_id: 'user1',
          username: 'featured_user1',
          avatar_url: 'https://example.com/avatar1.jpg',
          bio: 'Featured user bio',
          is_featured: true,
          story_count: 3,
          latest_story_created_at: '2024-01-01T00:00:00Z',
        },
        {
          user_id: 'user2',
          username: 'featured_user2',
          avatar_url: 'https://example.com/avatar2.jpg',
          bio: 'Featured user bio 2',
          is_featured: true,
          story_count: 0,
          latest_story_created_at: null,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await getFeaturedAccountsWithActiveStories();

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe('user1');
      expect(result[0].story_count).toBe(3);
    });

    it('should return empty array when no featured accounts have stories', async () => {
      const mockData: FeaturedAccount[] = [
        {
          user_id: 'user1',
          username: 'featured_user1',
          avatar_url: 'https://example.com/avatar1.jpg',
          bio: 'Featured user bio',
          is_featured: true,
          story_count: 0,
          latest_story_created_at: null,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await getFeaturedAccountsWithActiveStories();

      expect(result).toHaveLength(0);
    });
  });

  describe('isUserFeatured', () => {
    it('should return true when user is featured', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_featured: true },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await isUserFeatured('user1');

      expect(result).toBe(true);
    });

    it('should return false when user is not featured', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { is_featured: false },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await isUserFeatured('user1');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await isUserFeatured('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateFeaturedStatus', () => {
    it('should update featured status successfully', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateFeaturedStatus('user1', true);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({ is_featured: true });
      expect(result).toBe(true);
    });

    it('should throw error when update fails', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(updateFeaturedStatus('user1', true)).rejects.toThrow();
    });
  });
});
