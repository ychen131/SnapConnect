/**
 * @file vibeCheckCacheService.test.ts
 * @description Tests for the vibe check cache service
 */
import { vibeCheckCacheService } from './vibeCheckCacheService';
import { VibeCheckRecord } from './vibeCheckService';

describe('VibeCheckCacheService', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await vibeCheckCacheService.clearCache();
  });

  afterEach(async () => {
    // Clear cache after each test
    await vibeCheckCacheService.clearCache();
  });

  it('should initialize cache service', async () => {
    await vibeCheckCacheService.initialize();
    const stats = await vibeCheckCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSizeMB).toBe(0);
  });

  it('should cache and retrieve vibe checks', async () => {
    const userId = 'test-user-123';
    const mockVibeChecks: VibeCheckRecord[] = [
      {
        id: '1',
        user_id: userId,
        session_id: 'session-1',
        short_summary: 'Happy pup!',
        detailed_report: 'This dog is very happy',
        source_url: 'https://example.com/photo1.jpg',
        request_timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: userId,
        session_id: 'session-2',
        short_summary: 'Playful mood',
        detailed_report: 'This dog is playful',
        source_url: 'https://example.com/photo2.jpg',
        request_timestamp: new Date().toISOString(),
      },
    ];

    // Cache vibe checks
    await vibeCheckCacheService.cacheVibeChecks(userId, mockVibeChecks);

    // Retrieve cached vibe checks
    const cachedVibeChecks = await vibeCheckCacheService.getCachedVibeChecks(userId);
    expect(cachedVibeChecks).toEqual(mockVibeChecks);

    // Check if vibe checks are cached
    const isCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isCached).toBe(true);
  });

  it('should handle cache expiration', async () => {
    const userId = 'test-user-456';
    const mockVibeChecks: VibeCheckRecord[] = [
      {
        id: '1',
        user_id: userId,
        session_id: 'session-1',
        short_summary: 'Test vibe',
        detailed_report: 'Test report',
        request_timestamp: new Date().toISOString(),
      },
    ];

    // Cache vibe checks
    await vibeCheckCacheService.cacheVibeChecks(userId, mockVibeChecks);

    // Verify they're cached
    const isCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isCached).toBe(true);

    // Manually expire the cache by modifying the internal state
    // This is a bit hacky but necessary for testing expiration
    const cacheService = vibeCheckCacheService as any;
    const entry = cacheService.cacheIndex.get(userId);
    if (entry) {
      entry.expiresAt = Date.now() - 1000; // Set to 1 second ago
      await cacheService.saveCacheIndex();
    }

    // Check that cache is now expired
    const isStillCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isStillCached).toBe(false);

    // Should return null for expired cache
    const cachedVibeChecks = await vibeCheckCacheService.getCachedVibeChecks(userId);
    expect(cachedVibeChecks).toBe(null);
  });

  it('should invalidate cache for a user', async () => {
    const userId = 'test-user-789';
    const mockVibeChecks: VibeCheckRecord[] = [
      {
        id: '1',
        user_id: userId,
        session_id: 'session-1',
        short_summary: 'Test vibe',
        detailed_report: 'Test report',
        request_timestamp: new Date().toISOString(),
      },
    ];

    // Cache vibe checks
    await vibeCheckCacheService.cacheVibeChecks(userId, mockVibeChecks);

    // Verify they're cached
    const isCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isCached).toBe(true);

    // Invalidate cache
    await vibeCheckCacheService.invalidateCache(userId);

    // Verify cache is cleared
    const isStillCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isStillCached).toBe(false);
  });

  it('should provide cache statistics', async () => {
    const userId1 = 'user-1';
    const userId2 = 'user-2';
    const mockVibeChecks: VibeCheckRecord[] = [
      {
        id: '1',
        user_id: userId1,
        session_id: 'session-1',
        short_summary: 'Test vibe',
        detailed_report: 'Test report',
        request_timestamp: new Date().toISOString(),
      },
    ];

    // Cache vibe checks for two users
    await vibeCheckCacheService.cacheVibeChecks(userId1, mockVibeChecks);
    await vibeCheckCacheService.cacheVibeChecks(userId2, mockVibeChecks);

    const stats = await vibeCheckCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.totalSizeMB).toBeGreaterThan(0);
    expect(stats.oldestEntry).toBeGreaterThan(0);
    expect(stats.newestEntry).toBeGreaterThan(0);
  });

  it('should clear all cached vibe checks', async () => {
    const userId = 'test-user-clear';
    const mockVibeChecks: VibeCheckRecord[] = [
      {
        id: '1',
        user_id: userId,
        session_id: 'session-1',
        short_summary: 'Test vibe',
        detailed_report: 'Test report',
        request_timestamp: new Date().toISOString(),
      },
    ];

    // Cache vibe checks
    await vibeCheckCacheService.cacheVibeChecks(userId, mockVibeChecks);

    // Verify they're cached
    const isCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isCached).toBe(true);

    // Clear all cache
    await vibeCheckCacheService.clearCache();

    // Verify cache is empty
    const stats = await vibeCheckCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSizeMB).toBe(0);

    // Verify specific user cache is cleared
    const isStillCached = await vibeCheckCacheService.isVibeChecksCached(userId);
    expect(isStillCached).toBe(false);
  });
});
