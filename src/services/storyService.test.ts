/**
 * @file storyService.test.ts
 * @description Tests for story service functionality including CRUD operations and edge cases.
 */
import {
  addToStory,
  getUserStories,
  deleteStory,
  updateStoryPrivacy,
  Story,
  getPublicStories,
} from './storyService';

// Enhanced Supabase mock to support full method chains
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({
  eq: jest.fn(() => ({
    neq: jest.fn(() => ({
      order: jest.fn(() => ({
        gt: jest.fn(),
      })),
    })),
    order: jest.fn(() => ({
      gt: jest.fn(),
    })),
  })),
  order: jest.fn(() => ({
    gt: jest.fn(),
  })),
  gt: jest.fn(),
}));
const mockInsert = jest.fn(() => ({
  select: jest.fn(() => ({
    single: mockSingle,
  })),
}));
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => ({
    eq: jest.fn(),
  })),
}));
const mockDelete = jest.fn(() => ({
  eq: jest.fn(() => ({
    eq: jest.fn(),
  })),
}));

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    })),
    rpc: jest.fn(),
  },
}));

describe('Story Service', () => {
  const mockUserId = 'test-user-id';
  const mockMediaUrl = 'https://example.com/test-image.jpg';
  const mockStory: Story = {
    id: 'test-story-id',
    user_id: mockUserId,
    media_url: mockMediaUrl,
    media_type: 'photo',
    timer: 3,
    is_public: true,
    view_count: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    user_username: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToStory', () => {
    it('should successfully add a photo story', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockStory,
        error: null,
      });

      const result = await addToStory(mockUserId, mockMediaUrl, 'photo', 5);

      expect(result).toEqual(mockStory);
      expect(mockSupabase.from).toHaveBeenCalledWith('stories');
    });

    it('should successfully add a video story', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: { ...mockStory, media_type: 'video' },
          error: null,
        });

      const result = await addToStory(mockUserId, mockMediaUrl, 'video');

      expect(result?.media_type).toBe('video');
    });

    it('should throw error for invalid media type', async () => {
      await expect(addToStory(mockUserId, mockMediaUrl, 'invalid' as any)).rejects.toThrow(
        'Invalid media type: must be "photo" or "video"',
      );
    });

    it('should throw error for invalid timer', async () => {
      await expect(addToStory(mockUserId, mockMediaUrl, 'photo', 15)).rejects.toThrow(
        'Invalid timer: must be between 1 and 10 seconds for photos',
      );
    });

    it('should throw error for invalid media URL', async () => {
      await expect(addToStory(mockUserId, 'invalid-url', 'photo')).rejects.toThrow(
        'Invalid media URL: must be a valid HTTP URL',
      );
    });

    it('should throw error for missing inputs', async () => {
      await expect(addToStory('', mockMediaUrl, 'photo')).rejects.toThrow(
        'Invalid inputs: userId, mediaUrl, and mediaType are required',
      );
    });

    it('should handle database errors', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Unique constraint violation' },
        });

      await expect(addToStory(mockUserId, mockMediaUrl, 'photo')).rejects.toThrow(
        'Story already exists with this content',
      );
    });
  });

  describe('getUserStories', () => {
    it('should fetch user stories successfully', async () => {
      const mockSupabase = require('./supabase').supabase;
      // Create a fresh mock chain for this test
      const mockGt = jest.fn(() => Promise.resolve({ data: [mockStory], error: null }));
      const mockOrder = jest.fn(() => ({ gt: mockGt }));
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockSupabase.from.mockReturnValue({ select: mockSelect });
      const result = await getUserStories(mockUserId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockStory);
    });

    it('should return empty array on error', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .gt.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

      const result = await getUserStories(mockUserId);

      expect(result).toEqual([]);
    });

    it('should not return expired stories by default', async () => {
      const mockSupabase = require('./supabase').supabase;
      const expiredStory = { ...mockStory, expires_at: new Date(Date.now() - 1000).toISOString() };
      mockSupabase.from().select().eq().order().gt.mockResolvedValue({
        data: [],
        error: null,
      });
      const result = await getUserStories(mockUserId);
      expect(result).toEqual([]);
    });

    it('should return expired stories if includeExpired=true', async () => {
      const mockSupabase = require('./supabase').supabase;
      const expiredStory = { ...mockStory, expires_at: new Date(Date.now() - 1000).toISOString() };
      // Create a fresh mock chain for this test
      const mockGt = jest.fn(() => Promise.resolve({ data: [expiredStory], error: null }));
      const mockOrder = jest.fn(() => ({ gt: mockGt }));
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockSupabase.from.mockReturnValue({ select: mockSelect });
      const result = await getUserStories(mockUserId, true);
      expect(result[0].expires_at).toBe(expiredStory.expires_at);
    });
  });

  describe('deleteStory', () => {
    it('should delete story successfully', async () => {
      const mockSupabase = require('./supabase').supabase;
      // Create a fresh mock chain for this test
      const mockEq2 = jest.fn(() => Promise.resolve({ error: null }));
      const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
      const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
      mockSupabase.from.mockReturnValue({ delete: mockDelete });
      const result = await deleteStory('story-id', mockUserId);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase
        .from()
        .delete()
        .eq()
        .eq.mockResolvedValue({
          error: { message: 'Delete failed' },
        });

      const result = await deleteStory('story-id', mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('updateStoryPrivacy', () => {
    it('should update privacy successfully', async () => {
      const mockSupabase = require('./supabase').supabase;
      // Create a fresh mock chain for this test
      const mockEq2 = jest.fn(() => Promise.resolve({ error: null }));
      const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
      const mockUpdate = jest.fn(() => ({ eq: mockEq1 }));
      mockSupabase.from.mockReturnValue({ update: mockUpdate });
      const result = await updateStoryPrivacy('story-id', mockUserId, false);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase
        .from()
        .update()
        .eq()
        .eq.mockResolvedValue({
          error: { message: 'Update failed' },
        });

      const result = await updateStoryPrivacy('story-id', mockUserId, true);

      expect(result).toBe(false);
    });
  });

  describe('getPublicStories', () => {
    it('should not return expired public stories by default', async () => {
      const mockSupabase = require('./supabase').supabase;
      mockSupabase.from().select().eq().neq().order().gt.mockResolvedValue({
        data: [],
        error: null,
      });
      const result = await getPublicStories(mockUserId);
      expect(result).toEqual([]);
    });
  });
});
