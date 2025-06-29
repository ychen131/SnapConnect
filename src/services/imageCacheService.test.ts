/**
 * @file imageCacheService.test.ts
 * @description Tests for the image caching service
 */
import { imageCacheService } from './imageCacheService';
import * as FileSystem from 'expo-file-system';

describe('ImageCacheService', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await imageCacheService.clearCache();
  });

  afterEach(async () => {
    // Clear cache after each test
    await imageCacheService.clearCache();
  });

  it('should initialize cache service', async () => {
    await imageCacheService.initialize();
    const stats = await imageCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSizeMB).toBe(0);
  });

  it('should cache and retrieve an image', async () => {
    const testUrl = 'https://picsum.photos/200/200';

    // First call should download and cache
    const cachedPath1 = await imageCacheService.getCachedImage(testUrl);
    expect(cachedPath1).toBeTruthy();

    // Second call should return cached version
    const cachedPath2 = await imageCacheService.getCachedImage(testUrl);
    expect(cachedPath2).toBe(cachedPath1);

    // Check if image is cached
    const isCached = await imageCacheService.isImageCached(testUrl);
    expect(isCached).toBe(true);
  });

  it('should handle invalid URLs gracefully', async () => {
    const invalidUrl = 'https://invalid-url-that-does-not-exist.com/image.jpg';

    await expect(imageCacheService.getCachedImage(invalidUrl)).rejects.toThrow();

    const isCached = await imageCacheService.isImageCached(invalidUrl);
    expect(isCached).toBe(false);
  });

  it('should preload multiple images', async () => {
    const testUrls = [
      'https://picsum.photos/200/200?random=1',
      'https://picsum.photos/200/200?random=2',
      'https://picsum.photos/200/200?random=3',
    ];

    await imageCacheService.preloadImages(testUrls);

    // Check that all images are cached
    for (const url of testUrls) {
      const isCached = await imageCacheService.isImageCached(url);
      expect(isCached).toBe(true);
    }

    const stats = await imageCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(3);
  });

  it('should provide cache statistics', async () => {
    const testUrl = 'https://picsum.photos/200/200';
    await imageCacheService.getCachedImage(testUrl);

    const stats = await imageCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(1);
    expect(stats.totalSizeMB).toBeGreaterThan(0);
    expect(stats.oldestEntry).toBeGreaterThan(0);
    expect(stats.newestEntry).toBeGreaterThan(0);
  });

  it('should clear cache', async () => {
    const testUrl = 'https://picsum.photos/200/200';
    await imageCacheService.getCachedImage(testUrl);

    // Verify image is cached
    let stats = await imageCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(1);

    // Clear cache
    await imageCacheService.clearCache();

    // Verify cache is empty
    stats = await imageCacheService.getCacheStats();
    expect(stats.totalEntries).toBe(0);
    expect(stats.totalSizeMB).toBe(0);
  });

  it('should handle local files correctly', async () => {
    await imageCacheService.initialize();

    // Test local file detection
    const localFile = 'file:///var/mobile/test/image.jpg';
    const remoteUrl = 'https://example.com/image.jpg';

    // Mock FileSystem.getInfoAsync for local file
    const mockFileInfo = { exists: true, size: 1024 };
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue(mockFileInfo as any);

    // Mock FileSystem.copyAsync for local file copying
    jest.spyOn(FileSystem, 'copyAsync').mockResolvedValue();

    // Test local file handling
    const result = await imageCacheService.getCachedImage(localFile);
    expect(result).toBeDefined();

    // Verify copy was called instead of download
    expect(FileSystem.copyAsync).toHaveBeenCalled();

    // Test remote URL handling (should not call copy)
    jest.clearAllMocks();
    jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValue({ status: 200 } as any);

    await imageCacheService.getCachedImage(remoteUrl);
    expect(FileSystem.downloadAsync).toHaveBeenCalled();
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });

  it('should handle Expo cache files correctly', async () => {
    await imageCacheService.initialize();

    // Test Expo cache file detection
    const expoCacheFile =
      'file:///var/mobile/Containers/Data/Application/221AF46E-350D-4A80-99B9-3828205738B4/Library/Caches/ExponentExperienceData/@anonymous/snapdog/Camera/image.jpg';
    const regularLocalFile = 'file:///var/mobile/other/image.jpg';
    const remoteUrl = 'https://example.com/image.jpg';

    // Test that Expo cache files are treated as already cached
    const expoResult = await imageCacheService.getCachedImage(expoCacheFile);
    expect(expoResult).toBe(expoCacheFile); // Should return original path

    // Test that regular local files still get processed
    const mockFileInfo = { exists: true, size: 1024 };
    jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue(mockFileInfo as any);
    jest.spyOn(FileSystem, 'copyAsync').mockResolvedValue();

    await imageCacheService.getCachedImage(regularLocalFile);
    expect(FileSystem.copyAsync).toHaveBeenCalled();

    // Test that remote URLs still get downloaded
    jest.clearAllMocks();
    jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValue({ status: 200 } as any);

    await imageCacheService.getCachedImage(remoteUrl);
    expect(FileSystem.downloadAsync).toHaveBeenCalled();
  });
});
